import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, desc, sql, gt, gte, lt, lte, inArray } from "drizzle-orm";
import crypto from "crypto";
import { format } from "date-fns";
import {
  users,
  merchants,
  products,
  transactions,
  transactionItems,
  cashbacks,
  referrals,
  transfers,
  commissionSettings,
  PaymentMethod,
  TransactionStatus,
} from "@shared/schema";

// Middleware para verificar autenticação
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  next();
};

// Middleware para verificar tipo de usuário
const isUserType = (type: string) => (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Usuário não autenticado" });
  }
  if (req.user.type !== type) {
    return res.status(403).json({ message: `Acesso restrito para ${type}` });
  }
  next();
};

// Configurações globais do sistema (defaults)
const DEFAULT_SETTINGS = {
  platformFee: 0.02, // 2%
  merchantCommission: 0.02, // 2%
  clientCashback: 0.02, // 2%
  referralBonus: 0.01, // 1%
  minWithdrawal: 50, // R$ 50,00
  maxCashbackBonus: 10.0, // 10%
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação e rotas relacionadas
  setupAuth(app);
  
  // Inicializa as configurações de comissão
  await initializeCommissionSettings();
  
  // API para listar todas as lojas (pública)
  app.get("/api/stores", async (req, res) => {
    try {
      const allStores = await db
        .select({
          id: merchants.id,
          storeName: merchants.storeName,
          logo: merchants.logo,
          category: merchants.category,
          address: merchants.address,
          city: merchants.city,
          state: merchants.state,
          commissionRate: merchants.commissionRate,
          approved: merchants.approved,
          createdAt: merchants.createdAt,
          userId: merchants.userId,
        })
        .from(merchants)
        .where(eq(merchants.approved, true))
        .orderBy(merchants.storeName);
      
      // Adicionar informações adicionais como avaliações e número de clientes
      const storesWithDetails = await Promise.all(
        allStores.map(async (store) => {
          // Obter informações do usuário associado (lojista)
          const [merchantUser] = await db
            .select({
              name: users.name,
              email: users.email,
              phone: users.phone,
              photo: users.photo,
            })
            .from(users)
            .where(eq(users.id, store.userId));
            
          // Contar o número de transações
          const [transactionCount] = await db
            .select({
              count: sql`COUNT(*)`,
            })
            .from(transactions)
            .where(eq(transactions.merchantId, store.id));
          
          // Calcular o volume de vendas
          const [salesVolume] = await db
            .select({
              total: sql`COALESCE(SUM(amount), 0)`,
            })
            .from(transactions)
            .where(eq(transactions.merchantId, store.id));
          
          return {
            id: store.id,
            name: store.storeName,
            logo: store.logo,
            category: store.category,
            address: store.address,
            city: store.city,
            state: store.state,
            commissionRate: store.commissionRate,
            createdAt: store.createdAt,
            owner: merchantUser.name,
            email: merchantUser.email,
            phone: merchantUser.phone,
            photo: merchantUser.photo,
            transactions: Number(transactionCount.count) || 0,
            volume: Number(salesVolume.total) || 0,
            rating: 4.5, // Valor padrão, seria substituído por real no futuro
          };
        })
      );
      
      res.json(storesWithDetails);
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      res.status(500).json({ message: "Erro ao buscar lojas" });
    }
  });
  
  // API para buscar detalhes de uma loja específica
  app.get("/api/stores/:id", async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      
      const [store] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, storeId));
      
      if (!store) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }
      
      // Obter informações do usuário associado (lojista)
      const [merchantUser] = await db
        .select({
          name: users.name,
          email: users.email,
          phone: users.phone,
          photo: users.photo,
        })
        .from(users)
        .where(eq(users.id, store.userId));
        
      // Obter produtos da loja
      const storeProducts = await db
        .select()
        .from(products)
        .where(eq(products.merchantId, storeId))
        .limit(10);
        
      // Obter transações recentes
      const recentTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          date: transactions.createdAt,
          status: transactions.status,
        })
        .from(transactions)
        .where(eq(transactions.merchantId, storeId))
        .orderBy(desc(transactions.createdAt))
        .limit(5);
        
      // Contar o número de transações
      const [transactionCount] = await db
        .select({
          count: sql`COUNT(*)`,
        })
        .from(transactions)
        .where(eq(transactions.merchantId, storeId));
      
      // Calcular o volume de vendas
      const [salesVolume] = await db
        .select({
          total: sql`COALESCE(SUM(amount), 0)`,
        })
        .from(transactions)
        .where(eq(transactions.merchantId, storeId));
      
      const storeDetails = {
        ...store,
        owner: merchantUser.name,
        email: merchantUser.email,
        phone: merchantUser.phone,
        photo: merchantUser.photo,
        products: storeProducts,
        recentTransactions,
        transactionCount: Number(transactionCount.count) || 0,
        salesVolume: Number(salesVolume.total) || 0,
        rating: 4.5, // Valor padrão, seria substituído por real no futuro
      };
      
      res.json(storeDetails);
    } catch (error) {
      console.error("Erro ao buscar detalhes da loja:", error);
      res.status(500).json({ message: "Erro ao buscar detalhes da loja" });
    }
  });
  
  // API para listar lojas para o painel de administração (completa)
  app.get("/api/admin/stores", isUserType("admin"), async (req, res) => {
    try {
      const allStores = await db
        .select({
          id: merchants.id,
          storeName: merchants.storeName,
          logo: merchants.logo,
          category: merchants.category,
          address: merchants.address,
          city: merchants.city,
          state: merchants.state,
          commissionRate: merchants.commissionRate,
          approved: merchants.approved,
          createdAt: merchants.createdAt,
          userId: merchants.userId,
        })
        .from(merchants)
        .orderBy(merchants.createdAt, "desc");
      
      // Adicionar informações adicionais como avaliações e número de clientes
      const storesWithDetails = await Promise.all(
        allStores.map(async (store) => {
          // Obter informações do usuário associado (lojista)
          const [merchantUser] = await db
            .select({
              name: users.name,
              email: users.email,
              phone: users.phone,
              cpfCnpj: users.cpfCnpj,
              status: users.status,
            })
            .from(users)
            .where(eq(users.id, store.userId));
            
          // Contar o número de transações
          const [transactionCount] = await db
            .select({
              count: sql`COUNT(*)`,
            })
            .from(transactions)
            .where(eq(transactions.merchantId, store.id));
          
          // Calcular o volume de vendas
          const [salesVolume] = await db
            .select({
              total: sql`COALESCE(SUM(amount), 0)`,
            })
            .from(transactions)
            .where(eq(transactions.merchantId, store.id));
          
          return {
            id: store.id,
            name: store.storeName,
            logo: store.logo,
            category: store.category,
            address: store.address,
            city: store.city,
            state: store.state,
            commissionRate: store.commissionRate,
            approved: store.approved,
            createdAt: store.createdAt,
            owner: merchantUser.name,
            email: merchantUser.email,
            phone: merchantUser.phone,
            cnpj: merchantUser.cpfCnpj,
            status: merchantUser.status,
            transactions: Number(transactionCount.count) || 0,
            volume: Number(salesVolume.total) || 0,
          };
        })
      );
      
      res.json({ stores: storesWithDetails });
    } catch (error) {
      console.error("Erro ao buscar lojas:", error);
      res.status(500).json({ message: "Erro ao buscar lojas" });
    }
  });
  
  // API para aprovar uma loja (admin)
  app.post("/api/admin/stores/:id/approve", isUserType("admin"), async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      
      const [updatedStore] = await db
        .update(merchants)
        .set({
          approved: true,
        })
        .where(eq(merchants.id, storeId))
        .returning();
        
      if (!updatedStore) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }
      
      res.json({ message: "Loja aprovada com sucesso", store: updatedStore });
    } catch (error) {
      console.error("Erro ao aprovar loja:", error);
      res.status(500).json({ message: "Erro ao aprovar loja" });
    }
  });
  
  // API para rejeitar uma loja (admin)
  app.post("/api/admin/stores/:id/reject", isUserType("admin"), async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Motivo da rejeição é obrigatório" });
      }
      
      // Obter dados da loja
      const [store] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, storeId));
      
      if (!store) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }
      
      // Atualizar status do usuário lojista
      await db
        .update(users)
        .set({
          status: "rejected",
        })
        .where(eq(users.id, store.userId));
      
      // Em uma implementação real, enviaríamos um email com o motivo da rejeição
      
      res.json({ message: "Loja rejeitada com sucesso" });
    } catch (error) {
      console.error("Erro ao rejeitar loja:", error);
      res.status(500).json({ message: "Erro ao rejeitar loja" });
    }
  });
  
  // API para ativar/desativar uma loja (admin)
  app.post("/api/admin/stores/:id/toggle-status", isUserType("admin"), async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      
      // Obter dados da loja
      const [store] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, storeId));
      
      if (!store) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }
      
      // Obter status atual do usuário
      const [merchantUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, store.userId));
      
      const newStatus = merchantUser.status === "active" ? "inactive" : "active";
      
      // Atualizar status do usuário lojista
      await db
        .update(users)
        .set({
          status: newStatus,
        })
        .where(eq(users.id, store.userId));
      
      res.json({ message: `Loja ${newStatus === "active" ? "ativada" : "desativada"} com sucesso` });
    } catch (error) {
      console.error("Erro ao alterar status da loja:", error);
      res.status(500).json({ message: "Erro ao alterar status da loja" });
    }
  });
  
  // API para atualizar taxa de comissão de uma loja (admin)
  app.post("/api/admin/stores/:id/commission", isUserType("admin"), async (req, res) => {
    try {
      const storeId = parseInt(req.params.id);
      const { commissionRate } = req.body;
      
      if (commissionRate === undefined || isNaN(Number(commissionRate))) {
        return res.status(400).json({ message: "Taxa de comissão inválida" });
      }
      
      const [updatedStore] = await db
        .update(merchants)
        .set({
          commissionRate: Number(commissionRate),
        })
        .where(eq(merchants.id, storeId))
        .returning();
        
      if (!updatedStore) {
        return res.status(404).json({ message: "Loja não encontrada" });
      }
      
      res.json({ message: "Taxa de comissão atualizada com sucesso", store: updatedStore });
    } catch (error) {
      console.error("Erro ao atualizar taxa de comissão:", error);
      res.status(500).json({ message: "Erro ao atualizar taxa de comissão" });
    }
  });
  
  // Endpoint para obter dados do perfil autenticado
  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      // Excluir senha e outros dados sensíveis
      const { password, ...userData } = req.user;
      return res.json(userData);
    }
    return res.status(401).json({ message: "Usuário não autenticado" });
  });
  
  // Inicializar configurações de comissão se não existirem
  async function initializeCommissionSettings() {
    try {
      // Verificar se já existem configurações
      const existingSettings = await db.select().from(commissionSettings).limit(1);
      
      if (existingSettings.length === 0) {
        // Criar configurações padrão
        await db.insert(commissionSettings).values({
          platformFee: DEFAULT_SETTINGS.platformFee,
          merchantCommission: DEFAULT_SETTINGS.merchantCommission,
          clientCashback: DEFAULT_SETTINGS.clientCashback,
          referralBonus: DEFAULT_SETTINGS.referralBonus,
          minWithdrawal: DEFAULT_SETTINGS.minWithdrawal,
          maxCashbackBonus: DEFAULT_SETTINGS.maxCashbackBonus,
        });
        
        console.log("Configurações de comissão padrão criadas com sucesso");
      }
    } catch (error) {
      console.error("Erro ao inicializar configurações de comissão:", error);
    }
  }
  
  // Inicializar as configurações na inicialização do servidor
  initializeCommissionSettings();
  
  // ROTAS DO ADMIN
  
  // Obter configurações de taxas
  app.get("/api/admin/settings/rates", isUserType("admin"), async (req, res) => {
    try {
      const settings = await db.select().from(commissionSettings).limit(1);
      
      if (settings.length === 0) {
        // Se não houver configurações, criar as padrões e retornar
        const [newSettings] = await db.insert(commissionSettings).values({
          platformFee: DEFAULT_SETTINGS.platformFee,
          merchantCommission: DEFAULT_SETTINGS.merchantCommission,
          clientCashback: DEFAULT_SETTINGS.clientCashback,
          referralBonus: DEFAULT_SETTINGS.referralBonus,
          minWithdrawal: DEFAULT_SETTINGS.minWithdrawal,
          maxCashbackBonus: DEFAULT_SETTINGS.maxCashbackBonus,
        }).returning();
        
        return res.json(newSettings);
      }
      
      res.json(settings[0]);
    } catch (error) {
      console.error("Erro ao buscar configurações de taxas:", error);
      res.status(500).json({ message: "Erro ao buscar configurações de taxas" });
    }
  });
  
  // Atualizar configurações de taxas
  app.patch("/api/admin/settings/rates", isUserType("admin"), async (req, res) => {
    try {
      const {
        platformFee,
        merchantCommission,
        clientCashback,
        referralBonus,
        minWithdrawal,
        maxCashbackBonus
      } = req.body;
      
      // Buscar configurações existentes
      const settings = await db.select().from(commissionSettings).limit(1);
      
      if (settings.length === 0) {
        // Se não houver configurações, criar as novas
        const [newSettings] = await db.insert(commissionSettings).values({
          platformFee: platformFee ?? DEFAULT_SETTINGS.platformFee,
          merchantCommission: merchantCommission ?? DEFAULT_SETTINGS.merchantCommission,
          clientCashback: clientCashback ?? DEFAULT_SETTINGS.clientCashback,
          referralBonus: referralBonus ?? DEFAULT_SETTINGS.referralBonus,
          minWithdrawal: minWithdrawal ?? DEFAULT_SETTINGS.minWithdrawal,
          maxCashbackBonus: maxCashbackBonus ?? DEFAULT_SETTINGS.maxCashbackBonus,
          updatedBy: req.user?.id,
        }).returning();
        
        return res.json(newSettings);
      }
      
      // Atualizar configurações existentes
      const [updatedSettings] = await db.update(commissionSettings)
        .set({
          ...(platformFee !== undefined && { platformFee }),
          ...(merchantCommission !== undefined && { merchantCommission }),
          ...(clientCashback !== undefined && { clientCashback }),
          ...(referralBonus !== undefined && { referralBonus }),
          ...(minWithdrawal !== undefined && { minWithdrawal }),
          ...(maxCashbackBonus !== undefined && { maxCashbackBonus }),
          updatedAt: new Date(),
          updatedBy: req.user?.id,
        })
        .where(eq(commissionSettings.id, settings[0].id))
        .returning();
      
      res.json(updatedSettings);
    } catch (error) {
      console.error("Erro ao atualizar configurações de taxas:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações de taxas" });
    }
  });
  
  // Dashboard do Admin
  app.get("/api/admin/dashboard", isUserType("admin"), async (req, res) => {
    try {
      // Implementar dashboard do administrador com métricas gerais
      const userCount = await db.select({ count: sql`COUNT(*)` }).from(users);
      const merchantCount = await db.select({ count: sql`COUNT(*)` }).from(merchants);
      const transactionCount = await db.select({ count: sql`COUNT(*)` }).from(transactions);
      const totalSales = await db.select({ sum: sql`SUM(amount)` }).from(transactions);
      
      const recentTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          date: transactions.createdAt,
          customerName: users.name,
          merchantName: merchants.name,
          status: transactions.status
        })
        .from(transactions)
        .innerJoin(users, eq(transactions.customerId, users.id))
        .innerJoin(merchants, eq(transactions.merchantId, merchants.id))
        .orderBy(desc(transactions.createdAt))
        .limit(5);
      
      res.json({
        userCount: userCount[0].count,
        merchantCount: merchantCount[0].count,
        transactionCount: transactionCount[0].count,
        totalSales: totalSales[0].sum || 0,
        recentTransactions
      });
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard admin:", error);
      res.status(500).json({ message: "Erro ao buscar dados do dashboard" });
    }
  });
  
  // ROTAS DO LOJISTA
  
  // Dashboard do Lojista
  app.get("/api/merchant/dashboard", isUserType("merchant"), async (req, res) => {
    try {
      // Implementar dashboard do lojista com métricas das vendas
      const merchantId = req.user.id;
      
      // Obter dados do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
      
      // Obter estatísticas de vendas
      const salesCountResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(transactions)
        .where(eq(transactions.merchantId, merchant.id));
      
      const totalSalesResult = await db
        .select({ sum: sql`SUM(amount)` })
        .from(transactions)
        .where(eq(transactions.merchantId, merchant.id));
      
      const todaySalesResult = await db
        .select({ sum: sql`SUM(amount)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.merchantId, merchant.id),
            sql`DATE(${transactions.createdAt}) = CURRENT_DATE`
          )
        );
        
      // Obter vendas recentes
      const recentSales = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback: transactions.cashbackAmount,
          date: transactions.createdAt,
          customerName: users.name,
          status: transactions.status
        })
        .from(transactions)
        .innerJoin(users, eq(transactions.customerId, users.id))
        .where(eq(transactions.merchantId, merchant.id))
        .orderBy(desc(transactions.createdAt))
        .limit(5);
        
      res.json({
        merchant,
        salesCount: salesCountResult[0].count || 0,
        totalSales: totalSalesResult[0].sum || 0,
        todaySales: todaySalesResult[0].sum || 0,
        recentSales
      });
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard lojista:", error);
      res.status(500).json({ message: "Erro ao buscar dados do dashboard" });
    }
  });
  
  // Listar produtos do lojista
  app.get("/api/merchant/products", isUserType("merchant"), async (req, res) => {
    try {
      const merchantId = req.user.id;
      
      // Obter dados do merchant
      const merchantList = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
      
      if (!merchantList.length) {
        return res.json([]);
      }
      
      const merchant = merchantList[0];
        
      // Listar produtos do lojista
      const productsList = await db
        .select()
        .from(products)
        .where(eq(products.merchantId, merchant.id))
        .orderBy(products.name);
        
      res.json(productsList);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      res.status(500).json({ message: "Erro ao buscar produtos" });
    }
  });
  
  // Listar vendas do lojista
  app.get("/api/merchant/sales", isUserType("merchant"), async (req, res) => {
    try {
      const merchantId = req.user.id;
      
      // Obter dados do merchant
      const merchantList = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
        
      if (!merchantList.length) {
        return res.json({ transactions: [] });
      }
      
      const merchant = merchantList[0];
        
      // Listar transações
      const transactions_list = await db
        .select({
          id: transactions.id,
          customerId: transactions.customerId,
          customer: users.name,
          date: transactions.createdAt,
          amount: transactions.amount,
          cashback: transactions.cashbackAmount,
          status: transactions.status,
          paymentMethod: transactions.paymentMethod,
          items: sql`CONCAT(COUNT(${transactionItems.id}), ' itens')`.as("items")
        })
        .from(transactions)
        .innerJoin(users, eq(transactions.customerId, users.id))
        .leftJoin(transactionItems, eq(transactions.id, transactionItems.transactionId))
        .where(eq(transactions.merchantId, merchant.id))
        .groupBy(transactions.id, users.name, users.id)
        .orderBy(desc(transactions.createdAt));
        
      res.json({ transactions: transactions_list });
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
      res.status(500).json({ message: "Erro ao buscar vendas" });
    }
  });
  
  // Registrar uma nova venda
  app.post("/api/merchant/sales", isUserType("merchant"), async (req, res) => {
    try {
      const merchantUserId = req.user.id;
      
      // Obter dados do merchant
      const merchantResults = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantUserId));
        
      if (merchantResults.length === 0) {
        console.error(`Lojista não encontrado para o usuário ID ${merchantUserId}`);
        return res.status(404).json({ message: "Dados do lojista não encontrados" });
      }
      
      const merchant = merchantResults[0];
      console.log("Merchant encontrado:", merchant);
      
      // Extrair dados da venda
      const { 
        customerId, 
        items, 
        subtotal,
        discount,
        total, 
        cashback, 
        referralBonus,
        referrerId,
        paymentMethod, 
        notes,
        manualAmount
      } = req.body;
      
      console.log("Dados da venda:", { customerId, total, cashback, paymentMethod });
      
      // Verificar se o cliente existe
      const customer = await db
        .select()
        .from(users)
        .where(eq(users.id, customerId));
        
      if (customer.length === 0) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      
      // Iniciar transação
      // Registrar a transação
      const [transaction] = await db.insert(transactions).values({
        userId: customerId,        // Aqui modificamos para usar userId em vez de customerId
        merchantId: merchant.id,
        amount: total.toString(),  // Convertemos para string já que é numeric no schema
        cashbackAmount: cashback.toString(),
        referralAmount: referralBonus ? referralBonus.toString() : "0",
        status: TransactionStatus.COMPLETED,
        paymentMethod: paymentMethod,
        description: notes || null
      }).returning();
      
      // Registrar os itens da transação
      if (items && items.length > 0) {
        for (const item of items) {
          await db.insert(transactionItems).values({
            transactionId: transaction.id,
            productId: item.productId || null,
            productName: item.productName || `Produto ${item.id}`,
            quantity: item.quantity,
            price: item.price.toString()
          });
        }
      }
      
      // Adicionar o cashback para o cliente
      await db.insert(cashbacks).values({
        userId: customerId,
        transactionId: transaction.id,
        amount: cashback.toString(),
        status: "active"
      });
      
      // Se houver bônus de indicação, adicionar para o referrerId
      if (referrerId && referralBonus > 0) {
        await db.insert(referrals).values({
          referrerId,
          referredId: customerId,
          bonus: referralBonus.toString(),
          status: "active",
          createdAt: new Date()
        });
      }
      
      res.status(201).json({ 
        message: "Venda registrada com sucesso", 
        transaction 
      });
    } catch (error) {
      console.error("Erro ao registrar venda:", error);
      res.status(500).json({ message: "Erro ao registrar venda" });
    }
  });
  
  // Buscar clientes (para registro de vendas)
  app.get("/api/merchant/customers", isUserType("merchant"), async (req, res) => {
    try {
      const { term, searchBy } = req.query;
      
      if (!term || term.toString().length < 2) {
        return res.json([]);
      }

      // Lista de clientes simplificada para resolver o problema
      const clientsList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone
        })
        .from(users)
        .where(
          and(
            eq(users.type, "client"),
            searchBy === "name" 
              ? sql`${users.name} ILIKE ${`%${term}%`}` 
              : searchBy === "email" 
                ? sql`${users.email} ILIKE ${`%${term}%`}`
                : searchBy === "phone"
                  ? sql`${users.phone} ILIKE ${`%${term}%`}`
                  : undefined
          )
        )
        .limit(10);
        
      // Adicionar código de referência
      const clientsWithReferralCode = clientsList.map(client => ({
        ...client,
        referralCode: `CL${client.id}`
      }));
      
      res.json(clientsWithReferralCode);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      res.status(500).json({ message: "Erro ao buscar clientes" });
    }
  });
  
  // Perfil do Lojista
  app.get("/api/merchant/profile", isUserType("merchant"), async (req, res) => {
    try {
      const merchantId = req.user.id;
      
      // Obter dados do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
        
      // Excluir dados sensíveis
      const { userId, ...merchantData } = merchant;
      
      res.json(merchantData);
    } catch (error) {
      console.error("Erro ao buscar perfil do lojista:", error);
      res.status(500).json({ message: "Erro ao buscar perfil" });
    }
  });
  
  // Atualizar perfil do lojista
  app.patch("/api/merchant/profile", isUserType("merchant"), async (req, res) => {
    try {
      const merchantId = req.user.id;
      const { name, description, address, phone, email, website, category } = req.body;
      
      // Obter dados do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
      
      // Atualizar dados do merchant
      const [updatedMerchant] = await db
        .update(merchants)
        .set({
          name,
          description,
          address,
          phone,
          email,
          website: website || null,
          category,
          updatedAt: new Date()
        })
        .where(eq(merchants.userId, merchantId))
        .returning();
      
      // Excluir dados sensíveis
      const { userId, ...merchantData } = updatedMerchant;
      
      res.json(merchantData);
    } catch (error) {
      console.error("Erro ao atualizar perfil do lojista:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
  });
  
  // Obter histórico de transações do lojista
  app.get("/api/merchant/transactions", isUserType("merchant"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const userId = req.user.id;
      const { status, paymentMethod, startDate, endDate, page = 1, limit = 20 } = req.query;
      
      // Obter dados do merchant
      const merchantResults = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, userId));
      
      if (!merchantResults || merchantResults.length === 0) {
        return res.status(404).json({ message: "Merchant não encontrado" });
      }
      
      const merchant = merchantResults[0];
      
      // Construir a query
      let query = db
        .select({
          id: transactions.id,
          customer: users.name,
          date: transactions.createdAt,
          amount: transactions.amount,
          cashback: transactions.cashbackAmount,
          paymentMethod: transactions.paymentMethod,
          status: transactions.status,
          items: sql`(SELECT COUNT(*) FROM ${transactionItems} WHERE ${transactionItems.transactionId} = ${transactions.id})`.as("items")
        })
        .from(transactions)
        .innerJoin(users, eq(transactions.userId, users.id))
        .where(eq(transactions.merchantId, merchant.id));
        
      // Aplicar filtros
      if (status) {
        query = query.where(eq(transactions.status, status as string));
      }
      
      if (paymentMethod) {
        query = query.where(eq(transactions.paymentMethod, paymentMethod as string));
      }
      
      if (startDate && endDate) {
        query = query.where(
          and(
            sql`${transactions.createdAt} >= ${startDate as string}`,
            sql`${transactions.createdAt} <= ${endDate as string}`
          )
        );
      }
      
      // Calcular totais (independente da paginação)
      const totalAmount = await db
        .select({ sum: sql`SUM(${transactions.amount})` })
        .from(transactions)
        .where(eq(transactions.merchantId, merchant.id));
      
      const totalCashback = await db
        .select({ sum: sql`SUM(${transactions.cashbackAmount})` })
        .from(transactions)
        .where(eq(transactions.merchantId, merchant.id));
      
      // Agrupar por status
      const statusCounts = await db
        .select({
          status: transactions.status,
          count: sql`COUNT(*)`.as("count")
        })
        .from(transactions)
        .where(eq(transactions.merchantId, merchant.id))
        .groupBy(transactions.status);
      
      // Agrupar por método de pagamento
      const paymentMethodSummary = await db
        .select({
          method: transactions.paymentMethod,
          sum: sql`SUM(${transactions.amount})`.as("sum")
        })
        .from(transactions)
        .where(eq(transactions.merchantId, merchant.id))
        .groupBy(transactions.paymentMethod);
      
      // Aplicar paginação
      const offset = (Number(page) - 1) * Number(limit);
      query = query.orderBy(desc(transactions.createdAt)).limit(Number(limit)).offset(offset);
      
      const transactions_list = await query;
      
      res.json({
        transactions: transactions_list,
        totalAmount: totalAmount[0]?.sum || 0,
        totalCashback: totalCashback[0]?.sum || 0,
        statusCounts,
        paymentMethodSummary
      });
    } catch (error) {
      console.error("Erro ao buscar histórico de transações:", error);
      res.status(500).json({ message: "Erro ao buscar histórico de transações" });
    }
  });
  
  // Obter relatórios financeiros do lojista
  app.get("/api/merchant/reports", isUserType("merchant"), async (req, res) => {
    try {
      const merchantId = req.user.id;
      const { period, startDate, endDate, type = "sales" } = req.query;
      
      // Obter dados do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
      
      // Determinar datas de início e fim com base no período
      let start_date, end_date;
      const now = new Date();
      
      switch (period) {
        case "today":
          start_date = new Date(now.setHours(0, 0, 0, 0));
          end_date = new Date(now.setHours(23, 59, 59, 999));
          break;
        case "week":
          start_date = new Date(now);
          start_date.setDate(start_date.getDate() - 7);
          end_date = new Date(now);
          break;
        case "month":
          start_date = new Date(now);
          start_date.setMonth(start_date.getMonth() - 1);
          end_date = new Date(now);
          break;
        case "quarter":
          start_date = new Date(now);
          start_date.setMonth(start_date.getMonth() - 3);
          end_date = new Date(now);
          break;
        case "year":
          start_date = new Date(now);
          start_date.setFullYear(start_date.getFullYear() - 1);
          end_date = new Date(now);
          break;
        case "custom":
          if (startDate && endDate) {
            start_date = new Date(startDate as string);
            end_date = new Date(endDate as string);
          } else {
            start_date = new Date();
            start_date.setMonth(start_date.getMonth() - 1);
            end_date = new Date();
          }
          break;
        default:
          start_date = new Date();
          start_date.setMonth(start_date.getMonth() - 1);
          end_date = new Date();
          break;
      }
      
      let response = {};
      
      // Relatórios de vendas
      if (type === "sales") {
        // Total de vendas no período
        const totalSales = await db
          .select({ sum: sql`SUM(${transactions.amount})` })
          .from(transactions)
          .where(
            and(
              eq(transactions.merchantId, merchant.id),
              sql`${transactions.createdAt} >= ${start_date.toISOString()}`,
              sql`${transactions.createdAt} <= ${end_date.toISOString()}`
            )
          );
        
        // Quantidade de vendas no período
        const salesCount = await db
          .select({ count: sql`COUNT(*)` })
          .from(transactions)
          .where(
            and(
              eq(transactions.merchantId, merchant.id),
              sql`${transactions.createdAt} >= ${start_date.toISOString()}`,
              sql`${transactions.createdAt} <= ${end_date.toISOString()}`
            )
          );
        
        // Total de cashback concedido no período
        const totalCashback = await db
          .select({ sum: sql`SUM(${transactions.cashbackAmount})` })
          .from(transactions)
          .where(
            and(
              eq(transactions.merchantId, merchant.id),
              sql`${transactions.createdAt} >= ${start_date.toISOString()}`,
              sql`${transactions.createdAt} <= ${end_date.toISOString()}`
            )
          );
        
        // Vendas agregadas por dia para gráfico de timeline
        const timeline = await db
          .select({
            date: sql`DATE_TRUNC('day', ${transactions.createdAt})`.as("date"),
            value: sql`SUM(${transactions.amount})`.as("value")
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.merchantId, merchant.id),
              sql`${transactions.createdAt} >= ${start_date.toISOString()}`,
              sql`${transactions.createdAt} <= ${end_date.toISOString()}`
            )
          )
          .groupBy(sql`DATE_TRUNC('day', ${transactions.createdAt})`)
          .orderBy(sql`DATE_TRUNC('day', ${transactions.createdAt})`);
        
        // Vendas por método de pagamento
        const byPaymentMethod = await db
          .select({
            name: transactions.paymentMethod,
            value: sql`SUM(${transactions.amount})`.as("value")
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.merchantId, merchant.id),
              sql`${transactions.createdAt} >= ${start_date.toISOString()}`,
              sql`${transactions.createdAt} <= ${end_date.toISOString()}`
            )
          )
          .groupBy(transactions.paymentMethod);
        
        // Top produtos vendidos
        const topProducts = await db
          .select({
            name: sql`${transactionItems.productName}`.as("name"),
            value: sql`SUM(${transactionItems.quantity})`.as("value"),
            revenue: sql`SUM(${transactionItems.price} * ${transactionItems.quantity})`.as("revenue")
          })
          .from(transactionItems)
          .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
          .where(
            and(
              eq(transactions.merchantId, merchant.id),
              sql`${transactions.createdAt} >= ${start_date.toISOString()}`,
              sql`${transactions.createdAt} <= ${end_date.toISOString()}`
            )
          )
          .groupBy(sql`${transactionItems.productName}`)
          .orderBy(sql`SUM(${transactionItems.quantity})`, "desc")
          .limit(5);
        
        response = {
          salesData: {
            total: totalSales[0]?.sum || 0,
            count: salesCount[0]?.count || 0,
            average: salesCount[0]?.count ? (totalSales[0]?.sum || 0) / salesCount[0]?.count : 0,
            cashback: totalCashback[0]?.sum || 0,
            timeline: timeline.map(item => ({
              date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              value: parseFloat(item.value as string)
            })),
            byPaymentMethod: byPaymentMethod.map(item => ({
              name: item.name === PaymentMethod.CREDIT_CARD ? "Cartão de Crédito" :
                   item.name === PaymentMethod.DEBIT_CARD ? "Cartão de Débito" :
                   item.name === PaymentMethod.CASH ? "Dinheiro" :
                   item.name === PaymentMethod.PIX ? "Pix" :
                   item.name === PaymentMethod.CASHBACK ? "Cashback" : item.name,
              value: parseFloat(item.value as string)
            })),
            topProducts
          }
        };
      }
      
      // Relatórios de clientes
      else if (type === "customers") {
        // Total de clientes únicos
        const totalCustomers = await db
          .select({
            count: sql`COUNT(DISTINCT ${transactions.customerId})`.as("count")
          })
          .from(transactions)
          .where(eq(transactions.merchantId, merchant.id));
        
        // Clientes que compraram no período atual (novos)
        const newCustomers = await db
          .select({
            count: sql`COUNT(DISTINCT ${transactions.customerId})`.as("count")
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.merchantId, merchant.id),
              sql`${transactions.createdAt} >= ${start_date.toISOString()}`,
              sql`${transactions.createdAt} <= ${end_date.toISOString()}`
            )
          );
        
        // Clientes recorrentes (que já compraram antes)
        const returningCustomers = totalCustomers[0]?.count - newCustomers[0]?.count;
        
        // Evolução mensal da base de clientes
        const timeline = await db
          .select({
            date: sql`DATE_TRUNC('month', ${transactions.createdAt})`.as("date"),
            value: sql`COUNT(DISTINCT ${transactions.customerId})`.as("value")
          })
          .from(transactions)
          .where(eq(transactions.merchantId, merchant.id))
          .groupBy(sql`DATE_TRUNC('month', ${transactions.createdAt})`)
          .orderBy(sql`DATE_TRUNC('month', ${transactions.createdAt})`);
        
        // Clientes por frequência de compras
        const byFrequency = await db
          .select({
            customerId: transactions.customerId,
            visits: sql`COUNT(*)`.as("visits")
          })
          .from(transactions)
          .where(eq(transactions.merchantId, merchant.id))
          .groupBy(transactions.customerId);
        
        const frequencyDistribution = {
          "1 compra": 0,
          "2-5 compras": 0,
          "6-10 compras": 0,
          "11+ compras": 0
        };
        
        byFrequency.forEach(item => {
          const visits = parseInt(item.visits as string);
          if (visits === 1) frequencyDistribution["1 compra"]++;
          else if (visits >= 2 && visits <= 5) frequencyDistribution["2-5 compras"]++;
          else if (visits >= 6 && visits <= 10) frequencyDistribution["6-10 compras"]++;
          else frequencyDistribution["11+ compras"]++;
        });
        
        // Top 5 clientes
        const topCustomers = await db
          .select({
            customerId: transactions.customerId,
            name: users.name,
            visits: sql`COUNT(*)`.as("visits"),
            spent: sql`SUM(${transactions.amount})`.as("spent")
          })
          .from(transactions)
          .innerJoin(users, eq(transactions.customerId, users.id))
          .where(eq(transactions.merchantId, merchant.id))
          .groupBy(transactions.customerId, users.name)
          .orderBy(sql`SUM(${transactions.amount})`, "desc")
          .limit(5);
        
        response = {
          customersData: {
            total: totalCustomers[0]?.count || 0,
            new: newCustomers[0]?.count || 0,
            returning: returningCustomers > 0 ? returningCustomers : 0,
            timeline: timeline.map(item => ({
              date: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short' }),
              value: parseInt(item.value as string)
            })),
            byFrequency: Object.entries(frequencyDistribution).map(([name, value]) => ({ name, value })),
            topCustomers: topCustomers.map(customer => ({
              name: customer.name,
              visits: parseInt(customer.visits as string),
              spent: parseFloat(customer.spent as string)
            }))
          }
        };
      }
      
      // Relatórios de cashback
      else if (type === "cashback") {
        // Total de cashback no período
        const totalCashback = await db
          .select({ sum: sql`SUM(${transactions.cashbackAmount})` })
          .from(transactions)
          .where(
            and(
              eq(transactions.merchantId, merchant.id),
              sql`${transactions.createdAt} >= ${start_date.toISOString()}`,
              sql`${transactions.createdAt} <= ${end_date.toISOString()}`
            )
          );
        
        // Quantidade de transações com cashback
        const cashbackCount = await db
          .select({ count: sql`COUNT(*)` })
          .from(transactions)
          .where(
            and(
              eq(transactions.merchantId, merchant.id),
              sql`${transactions.cashbackAmount} > 0`,
              sql`${transactions.createdAt} >= ${start_date.toISOString()}`,
              sql`${transactions.createdAt} <= ${end_date.toISOString()}`
            )
          );
        
        // Cashback diário para timeline
        const timeline = await db
          .select({
            date: sql`DATE_TRUNC('day', ${transactions.createdAt})`.as("date"),
            value: sql`SUM(${transactions.cashbackAmount})`.as("value")
          })
          .from(transactions)
          .where(
            and(
              eq(transactions.merchantId, merchant.id),
              sql`${transactions.createdAt} >= ${start_date.toISOString()}`,
              sql`${transactions.createdAt} <= ${end_date.toISOString()}`
            )
          )
          .groupBy(sql`DATE_TRUNC('day', ${transactions.createdAt})`)
          .orderBy(sql`DATE_TRUNC('day', ${transactions.createdAt})`);
        
        // Dados fictícios para a distribuição de cashback por tipo
        const distribution = [
          { name: "Cashback Direto", value: (totalCashback[0]?.sum || 0) * 0.8 },
          { name: "Bônus de Indicação", value: (totalCashback[0]?.sum || 0) * 0.15 },
          { name: "Promoções", value: (totalCashback[0]?.sum || 0) * 0.05 }
        ];
        
        response = {
          cashbackData: {
            total: totalCashback[0]?.sum || 0,
            count: cashbackCount[0]?.count || 0,
            average: cashbackCount[0]?.count ? (totalCashback[0]?.sum || 0) / cashbackCount[0]?.count : 0,
            timeline: timeline.map(item => ({
              date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              value: parseFloat(item.value as string)
            })),
            distribution
          }
        };
      }
      
      res.json(response);
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);
      res.status(500).json({ message: "Erro ao buscar relatórios" });
    }
  });
  
  // Obter referências e indicações do lojista
  app.get("/api/merchant/referrals", isUserType("merchant"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const merchantId = req.user.id;
      let userReferralCode = "";
      let referrals_list = [];
      let totalEarned = 0;
      let pendingReferrals = 0;
      let activeReferrals = 0;
      let referralsCount = 0;
      
      try {
        // Buscar dados do usuário com SQL direto
        const userResult = await db.execute(
          sql`SELECT id, name, email, invitation_code FROM users WHERE id = ${merchantId}`
        );
        
        if (userResult.rows.length === 0) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }
        
        const userData = userResult.rows[0];
        
        // Se não houver código de referência, gerar um e salvar
        userReferralCode = userData.invitation_code;
        if (!userReferralCode) {
          userReferralCode = "LJ" + merchantId.toString().padStart(4, '0');
          
          // Atualizar código de referência do usuário com SQL direto
          await db.execute(
            sql`UPDATE users SET invitation_code = ${userReferralCode} WHERE id = ${merchantId}`
          );
        }
      } catch (error) {
        console.error("Erro ao buscar/gerar código de referência:", error);
        // Se ocorrer erro, gerar um código baseado apenas no ID
        userReferralCode = "LJ" + merchantId.toString().padStart(4, '0');
      }
      
      try {
        // Obter dados do merchant
        const merchantResult = await db.execute(
          sql`SELECT id FROM merchants WHERE user_id = ${merchantId}`
        );
        
        if (merchantResult.rows.length === 0) {
          throw new Error("Dados do lojista não encontrados");
        }
        
        const merchantStoreId = merchantResult.rows[0].id;
        
        // Buscar referrals do lojista - aqui precisamos adaptar para o caso específico de lojistas
        // indicando outros lojistas, isso é diferente do caso de clientes
        const referralsResult = await db.execute(
          sql`
          SELECT 
            r.id, 
            r.referred_id, 
            r.bonus, 
            r.status, 
            r.created_at,
            u.name as referred_name,
            m.store_name as store_name
          FROM referrals r
          JOIN users u ON r.referred_id = u.id
          LEFT JOIN merchants m ON m.user_id = u.id
          WHERE r.referrer_id = ${merchantId} AND u.type = 'merchant'
          ORDER BY r.created_at DESC
          `
        );
        
        // Formatar lista de referências para o frontend
        referrals_list = referralsResult.rows.map(ref => ({
          id: ref.id,
          name: ref.referred_name || 'Usuário desconhecido',
          storeName: ref.store_name || 'Loja sem nome',
          date: format(new Date(ref.created_at), 'dd/MM/yyyy'),
          status: ref.status,
          commission: parseFloat(ref.bonus || '0').toFixed(2)
        }));
        
        // Calcular estatísticas
        const totalEarnedResult = await db.execute(
          sql`SELECT COALESCE(SUM(bonus), 0) as total
              FROM referrals
              WHERE referrer_id = ${merchantId} AND status = 'active'`
        );
        totalEarned = parseFloat(totalEarnedResult.rows[0]?.total || '0');
        
        const pendingResult = await db.execute(
          sql`SELECT COUNT(*) as count
              FROM referrals
              WHERE referrer_id = ${merchantId} AND status = 'pending'`
        );
        pendingReferrals = parseInt(pendingResult.rows[0]?.count || '0');
        
        const activeResult = await db.execute(
          sql`SELECT COUNT(*) as count
              FROM referrals
              WHERE referrer_id = ${merchantId} AND status = 'active'`
        );
        activeReferrals = parseInt(activeResult.rows[0]?.count || '0');
        
        // Contar total de referências
        const refCountResult = await db.execute(
          sql`SELECT COUNT(*) as count
              FROM referrals
              WHERE referrer_id = ${merchantId}`
        );
        referralsCount = parseInt(refCountResult.rows[0]?.count || '0');
      } catch (error) {
        console.error("Erro ao buscar dados de referência:", error);
        // Em caso de erro, manter valores padrão (já inicializados acima)
      }
      
      // Buscar configuração de comissão para referências (com tratamento de erro)
      let commissionRate = DEFAULT_SETTINGS.merchantCommission;
      try {
        const commissionResult = await db.execute(
          sql`SELECT value FROM commission_settings WHERE key = 'merchantCommission'`
        );
        
        // Usar o valor padrão do sistema se não houver configuração
        if (commissionResult.rows.length > 0) {
          commissionRate = parseFloat(commissionResult.rows[0].value);
        }
      } catch (error) {
        console.error("Erro ao buscar configuração de comissão:", error);
      }
      
      // Construir URL completa com base no host da requisição
      const host = req.get('host') || 'valecashback.com';
      const protocol = req.protocol || 'https';
      const referralUrl = `${protocol}://${host}/convite/${userReferralCode}`;
      
      res.json({
        referralCode: userReferralCode,
        referralUrl,
        referralsCount,
        pendingReferrals,
        activeReferrals,
        totalEarned: totalEarned.toFixed(2),
        commission: (commissionRate * 100).toFixed(1),
        referrals: referrals_list,
        monthlyEarnings: [
          { month: "Jan", value: 0 },
          { month: "Fev", value: 0 },
          { month: "Mar", value: 0 },
          { month: "Abr", value: 0 },
          { month: "Mai", value: 0 },
          { month: "Jun", value: 0 },
          { month: "Jul", value: 0 },
          { month: "Ago", value: 0 },
          { month: "Set", value: 0 },
          { month: "Out", value: 0 },
          { month: "Nov", value: 0 },
          { month: "Dez", value: 0 }
        ]
      });
    } catch (error) {
      console.error("Erro ao buscar referências:", error);
      
      // Em caso de erro, retornar pelo menos o código de referência básico
      const merchantId = req.user?.id || 0;
      const userReferralCode = "LJ" + merchantId.toString().padStart(4, '0');
      const host = req.get('host') || 'valecashback.com';
      const protocol = req.protocol || 'https';
      const referralUrl = `${protocol}://${host}/convite/${userReferralCode}`;
      
      res.json({
        referralCode: userReferralCode,
        referralUrl,
        referralsCount: 0,
        pendingReferrals: 0,
        activeReferrals: 0,
        totalEarned: "0.00",
        commission: (DEFAULT_SETTINGS.merchantCommission * 100).toFixed(1),
        referrals: [],
        monthlyEarnings: [
          { month: "Jan", value: 0 },
          { month: "Fev", value: 0 },
          { month: "Mar", value: 0 },
          { month: "Abr", value: 0 },
          { month: "Mai", value: 0 },
          { month: "Jun", value: 0 },
          { month: "Jul", value: 0 },
          { month: "Ago", value: 0 },
          { month: "Set", value: 0 },
          { month: "Out", value: 0 },
          { month: "Nov", value: 0 },
          { month: "Dez", value: 0 }
        ]
      });
    }
  });
  
  // Atualizar configurações do lojista
  app.patch("/api/merchant/settings/payment", isUserType("merchant"), async (req, res) => {
    try {
      const merchantId = req.user.id;
      const {
        acceptCashback,
        cashbackBonus,
        acceptCreditCard,
        acceptDebitCard,
        acceptPix,
        acceptCash,
        minimumValue,
        autoWithdraw,
        bankName,
        bankAccount,
        bankAgency,
        pixKey
      } = req.body;
      
      // Obter dados do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
      
      // Atualizar configurações
      const paymentSettings = {
        acceptCashback,
        cashbackBonus,
        acceptCreditCard,
        acceptDebitCard,
        acceptPix,
        acceptCash,
        minimumValue,
        autoWithdraw,
        bankName,
        bankAccount,
        bankAgency,
        pixKey
      };
      
      // Atualizar o merchant
      const [updatedMerchant] = await db
        .update(merchants)
        .set({
          paymentSettings: JSON.stringify(paymentSettings),
          updatedAt: new Date()
        })
        .where(eq(merchants.userId, merchantId))
        .returning();
      
      res.json({ message: "Configurações de pagamento atualizadas", paymentSettings });
    } catch (error) {
      console.error("Erro ao atualizar configurações de pagamento:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });
  
  app.patch("/api/merchant/settings/notifications", isUserType("merchant"), async (req, res) => {
    try {
      const merchantId = req.user.id;
      const notificationSettings = req.body;
      
      // Obter dados do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
      
      // Atualizar o merchant
      const [updatedMerchant] = await db
        .update(merchants)
        .set({
          notificationSettings: JSON.stringify(notificationSettings),
          updatedAt: new Date()
        })
        .where(eq(merchants.userId, merchantId))
        .returning();
      
      res.json({ message: "Configurações de notificações atualizadas", notificationSettings });
    } catch (error) {
      console.error("Erro ao atualizar configurações de notificações:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações" });
    }
  });
  
  // Alterar senha do lojista
  app.post("/api/merchant/change-password", isUserType("merchant"), async (req, res) => {
    try {
      const merchantId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      // Verificar senha atual
      const user = await storage.getUserByUsername(req.user.email);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verificar senha atual (usando a função do auth.ts)
      const isPasswordValid = await storage.comparePasswords(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      
      // Gerar hash da nova senha
      const hashedPassword = await storage.hashPassword(newPassword);
      
      // Atualizar senha
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, merchantId));
      
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });
  
  // ROTAS DO CLIENTE
  
  // Dashboard do Cliente
  app.get("/api/client/dashboard", isUserType("client"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const clientId = req.user.id;
      
      // Obter saldo de cashback usando SQL direto
      const cashbackResult = await db.execute(
        sql`SELECT COALESCE(SUM(balance), 0) as sum FROM cashbacks WHERE user_id = ${clientId}`
      );
      const cashbackBalance = parseFloat(cashbackResult.rows[0]?.sum || '0');
      
      // Obter saldo de indicações usando SQL direto
      const referralResult = await db.execute(
        sql`SELECT COALESCE(SUM(bonus), 0) as sum 
            FROM referrals 
            WHERE referrer_id = ${clientId} AND status = 'active'`
      );
      const referralBalance = parseFloat(referralResult.rows[0]?.sum || '0');
      
      // Contar transações
      const transactionsCountResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM transactions WHERE user_id = ${clientId}`
      );
      const transactionsCount = parseInt(transactionsCountResult.rows[0]?.count || '0');
      
      // Obter transações recentes
      const recentTransactionsResult = await db.execute(
        sql`SELECT 
            t.id, 
            t.amount, 
            t.cashback_amount as "cashbackAmount", 
            t.created_at as "createdAt", 
            t.status,
            m.store_name as "merchant"
          FROM transactions t
          JOIN merchants m ON t.merchant_id = m.id
          WHERE t.user_id = ${clientId}
          ORDER BY t.created_at DESC
          LIMIT 5`
      );
      
      // Formatar transações recentes para o frontend
      const recentTransactions = recentTransactionsResult.rows.map(t => ({
        id: t.id,
        merchant: t.merchant || 'Lojista desconhecido',
        date: format(new Date(t.createdAt), 'dd/MM/yyyy'),
        amount: parseFloat(t.amount),
        cashback: parseFloat(t.cashbackAmount),
        status: t.status
      }));
      
      // Estatísticas do mês
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      // Total de cashback ganho este mês
      const monthlyEarnedResult = await db.execute(
        sql`SELECT COALESCE(SUM(cashback_amount), 0) as sum
            FROM transactions
            WHERE user_id = ${clientId}
              AND created_at >= ${currentMonth}
              AND status = 'completed'`
      );
      const monthlyEarned = parseFloat(monthlyEarnedResult.rows[0]?.sum || '0');
      
      // Total transferido este mês
      const monthlyTransferredResult = await db.execute(
        sql`SELECT COALESCE(SUM(amount), 0) as sum
            FROM transfers
            WHERE from_user_id = ${clientId}
              AND created_at >= ${currentMonth}`
      );
      const monthlyTransferred = parseFloat(monthlyTransferredResult.rows[0]?.sum || '0');
      
      // Total recebido este mês
      const monthlyReceivedResult = await db.execute(
        sql`SELECT COALESCE(SUM(amount), 0) as sum
            FROM transfers
            WHERE to_user_id = ${clientId}
              AND created_at >= ${currentMonth}`
      );
      const monthlyReceived = parseFloat(monthlyReceivedResult.rows[0]?.sum || '0');
      
      // Histórico de saldos nos últimos 6 meses
      const balanceHistoryResult = await db.execute(
        sql`WITH months AS (
            SELECT generate_series(
              date_trunc('month', current_date - interval '5 months'),
              date_trunc('month', current_date),
              interval '1 month'
            ) as month_start
          )
          SELECT 
            to_char(m.month_start, 'Mon') as month,
            COALESCE(SUM(t.cashback_amount), 0) as monthly_sum
          FROM months m
          LEFT JOIN transactions t ON 
            t.user_id = ${clientId} AND 
            t.created_at >= m.month_start AND 
            t.created_at < m.month_start + interval '1 month' AND
            t.status = 'completed'
          GROUP BY m.month_start
          ORDER BY m.month_start`
      );
      
      // Mapear o histórico de saldos
      const balanceHistory = balanceHistoryResult.rows.map(row => ({
        month: row.month,
        value: parseFloat(row.monthly_sum)
      }));
      
      res.json({
        cashbackBalance,
        referralBalance,
        transactionsCount,
        recentTransactions,
        monthStats: {
          earned: monthlyEarned,
          transferred: monthlyTransferred,
          received: monthlyReceived
        },
        balanceHistory
      });
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard cliente:", error);
      res.status(500).json({ message: "Erro ao buscar dados do dashboard" });
    }
  });
  
  // Histórico de transações do cliente
  app.get("/api/client/transactions", isUserType("client"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const clientId = req.user.id;
      
      // Buscar as colunas relevantes diretamente, sem erro de colunas inexistentes
      const result = await db.execute(
        sql`SELECT 
            t.id, 
            t.merchant_id as "merchantId", 
            t.created_at as "date", 
            t.amount, 
            t.cashback_amount as "cashback", 
            t.status, 
            t.payment_method as "paymentMethod",
            m.store_name as "merchantName"
          FROM transactions t
          JOIN merchants m ON t.merchant_id = m.id
          WHERE t.user_id = ${clientId}
          ORDER BY t.created_at DESC`
      );
      
      // Formatar transações para o formato esperado pelo frontend
      const formattedTransactions = result.rows.map(t => ({
        id: t.id,
        merchant: t.merchantName || 'Lojista desconhecido',
        date: format(new Date(t.date), 'dd/MM/yyyy HH:mm'),
        amount: parseFloat(t.amount),
        cashback: parseFloat(t.cashback),
        status: t.status,
        paymentMethod: t.paymentMethod
      }));
        
      res.json(formattedTransactions);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      res.status(500).json({ message: "Erro ao buscar transações" });
    }
  });
  
  // Histórico de cashbacks e saldos do cliente
  app.get("/api/client/cashbacks", isUserType("client"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const clientId = req.user.id;
      
      // Consulta SQL direta para obter cashbacks
      const result = await db.execute(
        sql`SELECT 
            c.id, 
            c.transaction_id as "transactionId", 
            c.amount, 
            c.created_at as "date", 
            c.status,
            m.store_name as "merchant"
          FROM cashbacks c
          LEFT JOIN transactions t ON c.transaction_id = t.id
          LEFT JOIN merchants m ON t.merchant_id = m.id
          WHERE c.user_id = ${clientId}
          ORDER BY c.created_at DESC`
      );
      
      // Formatar cashbacks para o formato esperado pelo frontend
      const cashbacks_list = result.rows.map(c => ({
        id: c.id,
        transactionId: c.transactionId,
        amount: parseFloat(c.amount),
        date: format(new Date(c.date), 'dd/MM/yyyy HH:mm'),
        status: c.status,
        merchant: c.merchant || 'Lojista desconhecido'
      }));
      
      // Consulta SQL direta para calcular saldo total
      const balanceResult = await db.execute(
        sql`SELECT SUM(amount) as total 
          FROM cashbacks 
          WHERE user_id = ${clientId} AND status = 'active'`
      );
      
      const balance = balanceResult.rows[0]?.total 
        ? parseFloat(balanceResult.rows[0].total) 
        : 0;
      
      res.json({
        cashbacks: cashbacks_list,
        balance: balance
      });
    } catch (error) {
      console.error("Erro ao buscar cashbacks:", error);
      res.status(500).json({ message: "Erro ao buscar cashbacks" });
    }
  });
  
  // Histórico de indicações do cliente
  app.get("/api/client/referrals", isUserType("client"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const clientId = req.user.id;
      let userReferralCode = "";
      let referrals_list = [];
      let totalEarned = 0;
      let pendingReferrals = 0;
      let referralsCount = 0;
      
      try {
        // Buscar dados do usuário com SQL direto
        const userResult = await db.execute(
          sql`SELECT id, name, email, invitation_code FROM users WHERE id = ${clientId}`
        );
        
        if (userResult.rows.length === 0) {
          return res.status(404).json({ message: "Usuário não encontrado" });
        }
        
        const userData = userResult.rows[0];
        
        // Se não houver código de referência, gerar um e salvar
        userReferralCode = userData.invitation_code;
        if (!userReferralCode) {
          userReferralCode = "CL" + clientId.toString().padStart(4, '0');
          
          // Atualizar código de referência do usuário com SQL direto
          await db.execute(
            sql`UPDATE users SET invitation_code = ${userReferralCode} WHERE id = ${clientId}`
          );
        }
      } catch (error) {
        console.error("Erro ao buscar/gerar código de referência:", error);
        // Se ocorrer erro, gerar um código baseado apenas no ID
        userReferralCode = "CL" + clientId.toString().padStart(4, '0');
      }
      
      try {
        // Buscar todas as indicações do usuário com SQL direto
        const referralsResult = await db.execute(
          sql`SELECT 
              r.id, 
              r.referred_id, 
              r.bonus, 
              r.status, 
              r.created_at,
              u.name as referred_name
            FROM referrals r
            JOIN users u ON r.referred_id = u.id
            WHERE r.referrer_id = ${clientId}
            ORDER BY r.created_at DESC`
        );
        
        // Formatar lista de referências para o frontend
        referrals_list = referralsResult.rows.map(ref => ({
          id: ref.id,
          name: ref.referred_name || 'Usuário desconhecido',
          date: format(new Date(ref.created_at), 'dd/MM/yyyy'),
          status: ref.status,
          commission: parseFloat(ref.bonus).toFixed(2)
        }));
        
        // Calcular estatísticas
        const totalEarnedResult = await db.execute(
          sql`SELECT COALESCE(SUM(bonus), 0) as total
              FROM referrals
              WHERE referrer_id = ${clientId} AND status = 'active'`
        );
        totalEarned = parseFloat(totalEarnedResult.rows[0]?.total || '0');
        
        const pendingResult = await db.execute(
          sql`SELECT COUNT(*) as count
              FROM referrals
              WHERE referrer_id = ${clientId} AND status = 'pending'`
        );
        pendingReferrals = parseInt(pendingResult.rows[0]?.count || '0');
        
        // Contar total de referências
        const refCountResult = await db.execute(
          sql`SELECT COUNT(*) as count
              FROM referrals
              WHERE referrer_id = ${clientId}`
        );
        referralsCount = parseInt(refCountResult.rows[0]?.count || '0');
      } catch (error) {
        console.error("Erro ao buscar dados de referência:", error);
        // Em caso de erro, manter valores padrão (já inicializados acima)
      }
      
      // Buscar configuração de comissão para referências (com tratamento de erro)
      let commissionRate = DEFAULT_SETTINGS.referralBonus;
      try {
        const commissionResult = await db.execute(
          sql`SELECT value FROM commission_settings WHERE key = 'referralBonus'`
        );
        
        // Usar o valor padrão do sistema se não houver configuração
        if (commissionResult.rows.length > 0) {
          commissionRate = parseFloat(commissionResult.rows[0].value);
        }
      } catch (error) {
        console.error("Erro ao buscar configuração de comissão:", error);
      }
      
      // Construir URL completa com base no host da requisição
      const host = req.get('host') || 'valecashback.com';
      const protocol = req.protocol || 'https';
      const referralUrl = `${protocol}://${host}/convite/${userReferralCode}`;
      
      res.json({
        referralCode: userReferralCode,
        referralUrl,
        referralsCount,
        pendingReferrals,
        totalEarned: totalEarned.toFixed(2),
        commission: (commissionRate * 100).toFixed(1),
        referrals: referrals_list
      });
    } catch (error) {
      console.error("Erro ao buscar indicações:", error);
      
      // Em caso de erro, retornar pelo menos o código de referência básico
      const clientId = req.user?.id || 0;
      const userReferralCode = "CL" + clientId.toString().padStart(4, '0');
      const host = req.get('host') || 'valecashback.com';
      const protocol = req.protocol || 'https';
      const referralUrl = `${protocol}://${host}/convite/${userReferralCode}`;
      
      res.json({
        referralCode: userReferralCode,
        referralUrl,
        referralsCount: 0,
        pendingReferrals: 0,
        totalEarned: "0.00",
        commission: (DEFAULT_SETTINGS.referralBonus * 100).toFixed(1),
        referrals: []
      });
    }
  });
  
  // Histórico de transferências do cliente
  app.get("/api/client/transfers", isUserType("client"), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const clientId = req.user.id;
      
      // Usar SQL direto para evitar problemas com nomes de colunas
      const result = await db.execute(
        sql`SELECT 
            t.id, 
            t.amount, 
            t.from_user_id as "fromUserId", 
            t.to_user_id as "toUserId", 
            t.status, 
            t.created_at as "createdAt", 
            t.description,
            CASE 
              WHEN t.from_user_id = ${clientId} THEN 'outgoing'
              ELSE 'incoming'
            END as "type"
          FROM transfers t
          WHERE t.from_user_id = ${clientId} OR t.to_user_id = ${clientId}
          ORDER BY t.created_at DESC`
      );
      
      // Extrair IDs únicos de usuários
      const allTransfers = result.rows;
      const userIds = new Set([
        ...allTransfers.map(t => t.fromUserId),
        ...allTransfers.map(t => t.toUserId)
      ]);
      
      // Buscar dados dos usuários (convertendo o Set para array e depois para lista de valores separados por vírgula)
      const userIdsList = Array.from(userIds);
      let usersSql = 'SELECT id, name FROM users WHERE id IN (';
      
      // Se não houver IDs, evitamos erro de sintaxe
      if (userIdsList.length === 0) {
        usersSql += '-1)'; // um ID que não existe para retornar conjunto vazio
      } else {
        usersSql += userIdsList.join(',') + ')';
      }
      
      const usersResult = await db.execute(sql`${sql.raw(usersSql)}`);
      
      // Criar mapa para fácil acesso
      const usersMap = new Map(usersResult.rows.map(u => [u.id, u.name]));
      
      // Formatar transferências para o frontend
      const formattedTransfers = allTransfers.map(t => ({
        id: t.id,
        amount: parseFloat(t.amount),
        from: usersMap.get(t.fromUserId) || 'Usuário desconhecido',
        to: usersMap.get(t.toUserId) || 'Usuário desconhecido',
        date: format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm'),
        description: t.description || (t.type === 'outgoing' ? 'Transferência enviada' : 'Transferência recebida'),
        status: t.status,
        type: t.type
      }));
      
      res.json(formattedTransfers);
    } catch (error) {
      console.error("Erro ao buscar transferências:", error);
      res.status(500).json({ message: "Erro ao buscar transferências" });
    }
  });
  
  // Obter dados do código de convite
  app.get("/api/invite/:code", async (req, res) => {
    try {
      const referralCode = req.params.code;
      
      // Verificar formato do código
      if (!referralCode || referralCode.length < 4) {
        return res.status(404).json({ message: "Código de convite inválido" });
      }
      
      // Determinar tipo baseado no prefixo
      const isClient = referralCode.startsWith("CL");
      const isMerchant = referralCode.startsWith("LJ");
      
      if (!isClient && !isMerchant) {
        return res.status(404).json({ message: "Código de convite inválido" });
      }
      
      // Buscar usuário pelo código de referência com SQL direto
      const userResult = await db.execute(
        sql`SELECT id, name, email, type, photo 
            FROM users 
            WHERE invitation_code = ${referralCode}`
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: "Código de convite não encontrado" });
      }
      
      const referrerUser = userResult.rows[0];
      
      // Verificar se o tipo do usuário corresponde ao prefixo do código
      const expectedType = isClient ? "client" : "merchant";
      if (referrerUser.type !== expectedType) {
        return res.status(400).json({ message: "Código de convite inválido" });
      }
      
      // Dados do lojista, se for o caso
      let merchantData = null;
      if (isMerchant) {
        const merchantResult = await db.execute(
          sql`SELECT 
              id, 
              store_name as "storeName", 
              logo, 
              category, 
              description
            FROM merchants
            WHERE user_id = ${referrerUser.id}`
        );
        
        if (merchantResult.rows.length > 0) {
          const merchantInfo = merchantResult.rows[0];
          merchantData = {
            storeName: merchantInfo.storeName,
            logo: merchantInfo.logo || "https://via.placeholder.com/100",
            category: merchantInfo.category,
            description: merchantInfo.description
          };
        }
      }
      
      // Retornar informações sobre o convite
      res.json({
        referrerId: referrerUser.id,
        referrerName: referrerUser.name,
        referrerType: referrerUser.type,
        referralCode: referralCode,
        merchantData
      });
    } catch (error) {
      console.error("Erro ao buscar dados do convite:", error);
      res.status(500).json({ message: "Erro ao buscar dados do convite" });
    }
  });

  // Esta implementação foi removida para evitar duplicação de rotas
  
  // Endpoint para cadastro de cliente via convite
  app.post("/api/register/client", async (req, res) => {
    try {
      const { name, email, password, phone, referralCode, referralInfo } = req.body;
      
      // Verificar se o email já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (existingUser.length) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      
      // Gerar código de cliente baseado no próximo ID
      const lastUserId = await db
        .select({ maxId: sql`MAX(${users.id})` })
        .from(users);
      
      const nextId = (lastUserId[0]?.maxId || 0) + 1;
      const username = `${nextId}_Cliente`;
      
      // Cadastrar novo usuário
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          username,
          password, // Em produção, usaríamos hashPassword(password)
          phone,
          type: "client",
          status: "active",
          createdAt: new Date()
        })
        .returning();
      
      // Processar código de referência, se fornecido
      if (referralInfo && referralInfo.referrerId) {
        // Aqui implementaríamos a lógica de referência
        console.log(`Cliente ${newUser.id} registrado com referência ${referralInfo.referrerId}`);
        
        // Buscar configuração de comissão para referências (ou usar valor padrão)
        let referralBonus = 0.01; // 1% de bônus padrão
        try {
          const commissionResult = await db.execute(
            sql`SELECT value FROM commission_settings WHERE key = 'referralBonus'`
          );
          
          // Usar o valor padrão do sistema se não houver configuração
          if (commissionResult.rows.length > 0) {
            referralBonus = parseFloat(commissionResult.rows[0].value);
          }
        } catch (error) {
          console.error("Erro ao buscar configuração de comissão:", error);
        }
        
        // Registrar a referência
        await db.insert(referrals).values({
          referrerId: referralInfo.referrerId,
          referredId: newUser.id,
          bonus: "10.00", // Valor fixo de bônus para indicação de cliente
          status: "active",
          createdAt: new Date()
        });
      }
      
      res.status(201).json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        type: newUser.type,
        message: "Cadastro realizado com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      res.status(500).json({ message: "Erro ao processar o cadastro" });
    }
  });
  
  // Endpoint para cadastro de lojista via convite
  app.post("/api/register/merchant", async (req, res) => {
    try {
      const { name, email, password, phone, storeName, storeType, referralCode, referralInfo } = req.body;
      
      // Verificar se o email já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (existingUser.length) {
        return res.status(400).json({ message: "Email já cadastrado" });
      }
      
      // Gerar código de lojista baseado no próximo ID
      const lastUserId = await db
        .select({ maxId: sql`MAX(${users.id})` })
        .from(users);
      
      const nextId = (lastUserId[0]?.maxId || 0) + 1;
      const username = `${nextId}_Lojista`;
      
      // Cadastrar novo usuário
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email,
          username,
          password, // Em produção, usaríamos hashPassword(password)
          phone,
          type: "merchant",
          status: "pending", // Lojistas começam como pendentes até aprovação
          createdAt: new Date()
        })
        .returning();
      
      // Registrar informações da loja
      await db
        .insert(merchants)
        .values({
          userId: newUser.id,
          name: storeName,
          category: storeType,
          status: "pending",
          createdAt: new Date()
        });
      
      // Processar código de referência, se fornecido
      if (referralInfo && referralInfo.referrerId) {
        // Buscar configuração de comissão para referências de lojistas (ou usar valor padrão)
        let referralBonus = 0.02; // 2% de bônus padrão para lojistas
        try {
          const commissionResult = await db.execute(
            sql`SELECT value FROM commission_settings WHERE key = 'merchantReferralBonus'`
          );
          
          // Usar o valor padrão do sistema se não houver configuração
          if (commissionResult.rows.length > 0) {
            referralBonus = parseFloat(commissionResult.rows[0].value);
          }
        } catch (error) {
          console.error("Erro ao buscar configuração de comissão:", error);
        }
        
        // Registrar a referência com o bônus
        await db.insert(referrals).values({
          referrerId: referralInfo.referrerId,
          referredId: newUser.id,
          bonus: "25.00", // Valor fixo maior para indicação de lojista
          status: "active", 
          createdAt: new Date()
        });
      }
      
      res.status(201).json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        type: newUser.type,
        message: "Cadastro realizado com sucesso! Seu pedido será analisado."
      });
    } catch (error) {
      console.error("Erro ao cadastrar lojista:", error);
      res.status(500).json({ message: "Erro ao processar o cadastro" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
