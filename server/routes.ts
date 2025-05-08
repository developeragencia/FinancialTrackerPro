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

// Configurações globais do sistema
const SYSTEM_SETTINGS = {
  cashbackRate: 0.02, // 2%
  referralRate: 0.01, // 1%
  merchantCommission: 0.02, // 2%
  minWithdrawal: 50, // R$ 50,00
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
  
  // ROTAS DO ADMIN
  
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
