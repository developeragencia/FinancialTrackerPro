import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
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
          platformFee: DEFAULT_SETTINGS.platformFee.toString(),
          merchantCommission: DEFAULT_SETTINGS.merchantCommission.toString(),
          clientCashback: DEFAULT_SETTINGS.clientCashback.toString(),
          referralBonus: DEFAULT_SETTINGS.referralBonus.toString(),
          minWithdrawal: DEFAULT_SETTINGS.minWithdrawal.toString(),
          maxCashbackBonus: DEFAULT_SETTINGS.maxCashbackBonus.toString(),
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
          platformFee: DEFAULT_SETTINGS.platformFee.toString(),
          merchantCommission: DEFAULT_SETTINGS.merchantCommission.toString(),
          clientCashback: DEFAULT_SETTINGS.clientCashback.toString(),
          referralBonus: DEFAULT_SETTINGS.referralBonus.toString(),
          minWithdrawal: DEFAULT_SETTINGS.minWithdrawal.toString(),
          maxCashbackBonus: DEFAULT_SETTINGS.maxCashbackBonus.toString(),
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
          platformFee: platformFee?.toString() || DEFAULT_SETTINGS.platformFee.toString(),
          merchantCommission: merchantCommission?.toString() || DEFAULT_SETTINGS.merchantCommission.toString(),
          clientCashback: clientCashback?.toString() || DEFAULT_SETTINGS.clientCashback.toString(),
          referralBonus: referralBonus?.toString() || DEFAULT_SETTINGS.referralBonus.toString(),
          minWithdrawal: minWithdrawal?.toString() || DEFAULT_SETTINGS.minWithdrawal.toString(),
          maxCashbackBonus: maxCashbackBonus?.toString() || DEFAULT_SETTINGS.maxCashbackBonus.toString(),
          updatedBy: req.user?.id,
        }).returning();
        
        return res.json(newSettings);
      }
      
      // Atualizar configurações existentes
      const [updatedSettings] = await db.update(commissionSettings)
        .set({
          ...(platformFee !== undefined && { platformFee: platformFee.toString() }),
          ...(merchantCommission !== undefined && { merchantCommission: merchantCommission.toString() }),
          ...(clientCashback !== undefined && { clientCashback: clientCashback.toString() }),
          ...(referralBonus !== undefined && { referralBonus: referralBonus.toString() }),
          ...(minWithdrawal !== undefined && { minWithdrawal: minWithdrawal.toString() }),
          ...(maxCashbackBonus !== undefined && { maxCashbackBonus: maxCashbackBonus.toString() }),
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
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
        
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
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
        
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
      const merchantId = req.user.id;
      
      // Obter dados do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
      
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
        notes
      } = req.body;
      
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
        merchantId: merchant.id,
        customerId,
        amount: total,
        cashbackAmount: cashback,
        referralAmount: referralBonus || 0,
        status: TransactionStatus.completed,
        paymentMethod: paymentMethod as any,
        notes: notes || null
      }).returning();
      
      // Registrar os itens da transação
      if (items && items.length > 0) {
        for (const item of items) {
          await db.insert(transactionItems).values({
            transactionId: transaction.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          });
        }
      }
      
      // Adicionar o cashback para o cliente
      await db.insert(cashbacks).values({
        userId: customerId,
        transactionId: transaction.id,
        amount: cashback,
        status: "active"
      });
      
      // Se houver bônus de indicação, adicionar para o referrerId
      if (referrerId && referralBonus > 0) {
        await db.insert(referrals).values({
          referrerId,
          referredId: customerId,
          transactionId: transaction.id,
          amount: referralBonus,
          status: "active"
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
      
      let query = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        cpfCnpj: users.cpfCnpj,
        referralCode: sql`CONCAT('USER', ${users.id})`.as("referralCode")
      }).from(users).where(eq(users.type, "client"));
      
      // Filtrar por termo de busca
      if (searchBy === "name") {
        query = query.where(sql`${users.name} ILIKE ${`%${term}%`}`);
      } else if (searchBy === "email") {
        query = query.where(sql`${users.email} ILIKE ${`%${term}%`}`);
      } else if (searchBy === "phone") {
        query = query.where(sql`${users.phone} ILIKE ${`%${term}%`}`);
      } else if (searchBy === "code") {
        query = query.where(sql`CONCAT('USER', ${users.id}) ILIKE ${`%${term}%`}`);
      }
      
      const customers = await query.limit(10);
      
      // Adicionar informação sobre quem foi o referenciador
      const customersWithReferrals = await Promise.all(
        customers.map(async (customer) => {
          const referral = await db
            .select({
              referrerId: referrals.referrerId
            })
            .from(referrals)
            .where(eq(referrals.referredId, customer.id))
            .limit(1);
            
          return {
            ...customer,
            referredBy: referral.length > 0 ? referral[0].referrerId : null
          };
        })
      );
      
      res.json(customersWithReferrals);
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
      const merchantId = req.user.id;
      const { status, paymentMethod, startDate, endDate, page = 1, limit = 20 } = req.query;
      
      // Obter dados do merchant
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.userId, merchantId));
      
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
        .innerJoin(users, eq(transactions.customerId, users.id))
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
      const merchantId = req.user.id;
      
      // Obter referências (lojas indicadas)
      const referrals = await db
        .select({
          id: users.id,
          name: users.name,
          date: users.createdAt,
          status: users.status,
          commission: sql`0.00`.as("commission") // Placeholder, será calculado abaixo
        })
        .from(referrals)
        .innerJoin(users, eq(referrals.referredId, users.id))
        .where(eq(referrals.referrerId, merchantId))
        .orderBy(desc(users.createdAt));
      
      // Calcular comissões para cada referral
      const referralsWithCommission = await Promise.all(
        referrals.map(async (referral) => {
          // Calcular comissão total para esta referência
          const commission = await db
            .select({ sum: sql`SUM(amount)` })
            .from(referrals)
            .where(
              and(
                eq(referrals.referrerId, merchantId),
                eq(referrals.referredId, referral.id)
              )
            );
          
          return {
            ...referral,
            commission: parseFloat(commission[0]?.sum || "0")
          };
        })
      );
      
      // Obter estatísticas gerais
      const totalEarned = await db
        .select({ sum: sql`SUM(amount)` })
        .from(referrals)
        .where(eq(referrals.referrerId, merchantId));
      
      const activeReferrals = referralsWithCommission.filter(r => r.status === "active").length;
      
      // Gerar código de indicação baseado no ID do usuário
      const referralCode = `MERCH${merchantId}`;
      
      // Transações de comissões recebidas
      const commissionTransactions = await db
        .select({
          id: referrals.id,
          date: referrals.createdAt,
          amount: referrals.amount,
          store: users.name,
          type: sql`'Comissão de indicação'`.as("type")
        })
        .from(referrals)
        .innerJoin(users, eq(referrals.referredId, users.id))
        .where(eq(referrals.referrerId, merchantId))
        .orderBy(desc(referrals.createdAt))
        .limit(20);
      
      res.json({
        referrals: referralsWithCommission,
        referralCode,
        totalEarned: totalEarned[0]?.sum || 0,
        activeReferrals,
        commissionTransactions
      });
    } catch (error) {
      console.error("Erro ao buscar referências:", error);
      res.status(500).json({ message: "Erro ao buscar referências" });
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
      const clientId = req.user.id;
      
      // Calcular saldo de cashback
      const cashbackBalance = await db
        .select({ sum: sql`SUM(amount)` })
        .from(cashbacks)
        .where(
          and(
            eq(cashbacks.userId, clientId),
            eq(cashbacks.status, "active")
          )
        );
        
      // Calcular saldo de indicações
      const referralBalance = await db
        .select({ sum: sql`SUM(amount)` })
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, clientId),
            eq(referrals.status, "active")
          )
        );
        
      // Quantidade de transações
      const transactionsCount = await db
        .select({ count: sql`COUNT(*)` })
        .from(transactions)
        .where(eq(transactions.customerId, clientId));
        
      // Transações recentes
      const recentTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          cashback: transactions.cashbackAmount,
          date: transactions.createdAt,
          merchantName: merchants.name,
          status: transactions.status
        })
        .from(transactions)
        .innerJoin(merchants, eq(transactions.merchantId, merchants.id))
        .where(eq(transactions.customerId, clientId))
        .orderBy(desc(transactions.createdAt))
        .limit(5);
        
      res.json({
        cashbackBalance: cashbackBalance[0].sum || 0,
        referralBalance: referralBalance[0].sum || 0,
        transactionsCount: transactionsCount[0].count || 0,
        recentTransactions
      });
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard cliente:", error);
      res.status(500).json({ message: "Erro ao buscar dados do dashboard" });
    }
  });
  
  // Histórico de transações do cliente
  app.get("/api/client/transactions", isUserType("client"), async (req, res) => {
    try {
      const clientId = req.user.id;
      
      // Listar transações
      const transactions_list = await db
        .select({
          id: transactions.id,
          merchant: merchants.name,
          date: transactions.createdAt,
          amount: transactions.amount,
          cashback: transactions.cashbackAmount,
          status: transactions.status,
          paymentMethod: transactions.paymentMethod
        })
        .from(transactions)
        .innerJoin(merchants, eq(transactions.merchantId, merchants.id))
        .where(eq(transactions.customerId, clientId))
        .orderBy(desc(transactions.createdAt));
        
      res.json(transactions_list);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      res.status(500).json({ message: "Erro ao buscar transações" });
    }
  });
  
  // Histórico de cashbacks e saldos do cliente
  app.get("/api/client/cashbacks", isUserType("client"), async (req, res) => {
    try {
      const clientId = req.user.id;
      
      // Listar cashbacks
      const cashbacks_list = await db
        .select({
          id: cashbacks.id,
          transactionId: cashbacks.transactionId,
          amount: cashbacks.amount,
          date: cashbacks.createdAt,
          status: cashbacks.status,
          merchant: merchants.name
        })
        .from(cashbacks)
        .leftJoin(transactions, eq(cashbacks.transactionId, transactions.id))
        .leftJoin(merchants, eq(transactions.merchantId, merchants.id))
        .where(eq(cashbacks.userId, clientId))
        .orderBy(desc(cashbacks.createdAt));
        
      // Calcular saldo total
      const totalBalance = await db
        .select({ sum: sql`SUM(amount)` })
        .from(cashbacks)
        .where(
          and(
            eq(cashbacks.userId, clientId),
            eq(cashbacks.status, "active")
          )
        );
        
      res.json({
        cashbacks: cashbacks_list,
        balance: totalBalance[0].sum || 0
      });
    } catch (error) {
      console.error("Erro ao buscar cashbacks:", error);
      res.status(500).json({ message: "Erro ao buscar cashbacks" });
    }
  });
  
  // Histórico de indicações do cliente
  app.get("/api/client/referrals", isUserType("client"), async (req, res) => {
    try {
      const clientId = req.user.id;
      
      // Listar indicações onde o cliente é o indicador
      const referrals_list = await db
        .select({
          id: referrals.id,
          transactionId: referrals.transactionId,
          amount: referrals.amount,
          date: referrals.createdAt,
          status: referrals.status,
          referredName: users.name
        })
        .from(referrals)
        .leftJoin(users, eq(referrals.referredId, users.id))
        .where(eq(referrals.referrerId, clientId))
        .orderBy(desc(referrals.createdAt));
        
      // Calcular saldo total de indicações
      const totalBalance = await db
        .select({ sum: sql`SUM(amount)` })
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, clientId),
            eq(referrals.status, "active")
          )
        );
        
      // Obter quem indicou o cliente (se houver)
      const referrer = await db
        .select({
          id: referrals.id,
          referrerId: referrals.referrerId,
          referrerName: users.name,
          date: referrals.createdAt
        })
        .from(referrals)
        .leftJoin(users, eq(referrals.referrerId, users.id))
        .where(eq(referrals.referredId, clientId))
        .limit(1);
        
      res.json({
        referrals: referrals_list,
        balance: totalBalance[0].sum || 0,
        referrer: referrer.length > 0 ? referrer[0] : null
      });
    } catch (error) {
      console.error("Erro ao buscar indicações:", error);
      res.status(500).json({ message: "Erro ao buscar indicações" });
    }
  });
  
  // Histórico de transferências do cliente
  app.get("/api/client/transfers", isUserType("client"), async (req, res) => {
    try {
      const clientId = req.user.id;
      
      // Listar transferências
      const transfers_list = await db
        .select()
        .from(transfers)
        .where(eq(transfers.userId, clientId))
        .orderBy(desc(transfers.createdAt));
        
      res.json(transfers_list);
    } catch (error) {
      console.error("Erro ao buscar transferências:", error);
      res.status(500).json({ message: "Erro ao buscar transferências" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
