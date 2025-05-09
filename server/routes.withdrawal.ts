import { Request, Response, Express } from "express";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { isUserType } from "./routes";
import { 
  withdrawalRequests, 
  WithdrawalStatus,
  WithdrawalStatusValues,
  cashbacks, 
  users,
  merchants
} from "@shared/schema";
import { createWithdrawalRequestNotification, createAdminWithdrawalNotification } from "./helpers/notification";

// Validação dos dados de solicitação de saque
function validateWithdrawalData(data: any) {
  const errors = [];
  
  // Validar valor do saque
  if (!data.amount || isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
    errors.push("Valor do saque inválido");
  }
  
  // Valor mínimo de saque
  if (parseFloat(data.amount) < 50) {
    errors.push("O valor mínimo para saque é de $50,00");
  }
  
  // Validar campos obrigatórios
  if (!data.full_name) errors.push("Nome completo é obrigatório");
  if (!data.store_name) errors.push("Nome da loja é obrigatório");
  if (!data.phone) errors.push("Telefone é obrigatório");
  if (!data.email) errors.push("Email é obrigatório");
  if (!data.bank_name) errors.push("Nome do banco é obrigatório");
  if (!data.agency) errors.push("Agência é obrigatória");
  if (!data.account) errors.push("Conta é obrigatória");
  if (!data.payment_method) errors.push("Método de pagamento é obrigatório");
  
  return errors;
}

export function addWithdrawalRoutes(app: Express) {
  // Rota para obter dados da carteira do lojista (saldo atual, pendente e disponível)
  app.get("/api/merchant/wallet", isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Verificar se o usuário é um lojista
      const merchantResult = await db.select().from(merchants).where(eq(merchants.user_id, userId)).limit(1);
      if (merchantResult.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: "Acesso restrito a lojistas" 
        });
      }
      
      const merchant = merchantResult[0];
      
      // Buscar o saldo atual do lojista na tabela de cashbacks
      const cashbackResult = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, userId));
      
      // Calcular saldo atual (usando o valor da tabela de cashbacks)
      let currentBalance = 0;
      if (cashbackResult.length > 0) {
        currentBalance = parseFloat(cashbackResult[0].balance);
      }
      
      // Buscar saques pendentes
      const pendingWithdrawals = await db
        .select({
          total: sql`SUM(CAST(amount as DECIMAL(10,2)))`.as("total"),
          count: sql`COUNT(*)`.as("count")
        })
        .from(withdrawalRequests)
        .where(
          and(
            eq(withdrawalRequests.user_id, userId),
            eq(withdrawalRequests.status, "pending")
          )
        );
      
      // Calcular valores
      const pendingAmount = parseFloat(pendingWithdrawals[0]?.total || "0");
      const pendingCount = parseInt(pendingWithdrawals[0]?.count || "0");
      const availableBalance = currentBalance - pendingAmount;
      
      // Retornar dados da carteira
      res.json({
        success: true,
        walletData: {
          currentBalance,
          pendingAmount,
          pendingCount,
          availableBalance
        }
      });
    } catch (error) {
      console.error("Erro ao buscar dados da carteira:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar dados da carteira" 
      });
    }
  });
  
  // Rota para lojista criar uma solicitação de saque
  app.post("/api/merchant/withdrawal-requests", isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const data = req.body;
      
      // Validar dados da solicitação
      const validationErrors = validateWithdrawalData(data);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Dados inválidos", 
          errors: validationErrors 
        });
      }
      
      // Verificar saldo do lojista
      const [merchantBalance] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.user_id, userId));
      
      if (!merchantBalance) {
        return res.status(400).json({ 
          success: false, 
          message: "Saldo não encontrado" 
        });
      }
      
      const amount = parseFloat(data.amount);
      const currentBalance = parseFloat(merchantBalance.balance);
      
      // Verificar se existem solicitações de saque pendentes
      const pendingWithdrawals = await db
        .select({
          total: sql`SUM(CAST(amount as DECIMAL(10,2)))`.as("total")
        })
        .from(withdrawalRequests)
        .where(
          and(
            eq(withdrawalRequests.user_id, userId),
            eq(withdrawalRequests.status, "pending")
          )
        );
      
      const pendingAmount = parseFloat(pendingWithdrawals[0]?.total || "0");
      const availableBalance = currentBalance - pendingAmount;
      
      // Verificar se o saldo disponível é suficiente
      if (amount > availableBalance) {
        return res.status(400).json({ 
          success: false, 
          message: `Saldo insuficiente para este saque. Saldo disponível: $${availableBalance.toFixed(2)}` 
        });
      }
      
      // Obter dados do lojista
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId));
      
      if (!merchant) {
        return res.status(400).json({ 
          success: false, 
          message: "Dados do lojista não encontrados" 
        });
      }
      
      // Criar a solicitação de saque
      const [withdrawalRequest] = await db
        .insert(withdrawalRequests)
        .values({
          user_id: userId,
          merchant_id: merchant.id,
          amount: amount.toFixed(2),
          status: WithdrawalStatus.PENDING,
          payment_method: data.payment_method,
          full_name: data.full_name,
          store_name: data.store_name,
          phone: data.phone,
          email: data.email,
          bank_name: data.bank_name,
          agency: data.agency,
          account: data.account,
          created_at: new Date(),
          processed_at: null,
          notes: null
        })
        .returning();
      
      // Criar notificação para o lojista
      await createWithdrawalRequestNotification({
        userId,
        status: WithdrawalStatus.PENDING,
        amount: amount.toFixed(2)
      });
      
      // Criar notificação para administradores
      await createAdminWithdrawalNotification({
        merchantId: merchant.id,
        userId,
        amount: amount.toFixed(2),
        merchantName: merchant.store_name,
        requestId: withdrawalRequest.id
      });
      
      // Retornar a solicitação criada
      res.status(201).json({
        success: true,
        withdrawalRequest
      });
    } catch (error) {
      console.error("Erro ao criar solicitação de saque:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao processar solicitação de saque"
      });
    }
  });
  
  // Rota para lojista visualizar suas solicitações de saque
  app.get("/api/merchant/withdrawal-requests", isUserType("merchant"), async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      const withdrawals = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.user_id, userId))
        .orderBy(desc(withdrawalRequests.created_at));
      
      res.json({
        success: true,
        withdrawals
      });
    } catch (error) {
      console.error("Erro ao buscar solicitações de saque:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar solicitações de saque"
      });
    }
  });
  
  // Rota para administrador visualizar todas as solicitações de saque
  app.get("/api/admin/withdrawal-requests", isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const status = req.query.status as WithdrawalStatusValues | undefined;
      
      let query = db
        .select({
          ...withdrawalRequests,
          merchant_name: merchants.store_name,
          username: users.username,
          user_name: users.name,
          user_email: users.email,
          user_phone: users.phone
        })
        .from(withdrawalRequests)
        .leftJoin(users, eq(withdrawalRequests.user_id, users.id))
        .leftJoin(merchants, eq(users.id, merchants.user_id))
        .orderBy(desc(withdrawalRequests.created_at));
      
      // Filtrar por status se fornecido
      if (status) {
        query = query.where(eq(withdrawalRequests.status, status));
      }
      
      const withdrawals = await query;
      
      res.json({
        success: true,
        withdrawals
      });
    } catch (error) {
      console.error("Erro ao buscar solicitações de saque:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao buscar solicitações de saque"
      });
    }
  });
  
  // Rota para administrador processar uma solicitação de saque (aprovar ou rejeitar)
  app.patch("/api/admin/withdrawal-requests/:id", isUserType("admin"), async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.id);
      const { status, admin_notes } = req.body;
      
      // Validar status
      if (status !== WithdrawalStatus.COMPLETED && status !== WithdrawalStatus.REJECTED) {
        return res.status(400).json({ 
          success: false, 
          message: "Status inválido" 
        });
      }
      
      // Verificar se a solicitação existe
      const [existingRequest] = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, requestId));
      
      if (!existingRequest) {
        return res.status(404).json({ 
          success: false, 
          message: "Solicitação de saque não encontrada" 
        });
      }
      
      // Verificar se a solicitação já foi processada
      if (existingRequest.status !== WithdrawalStatus.PENDING) {
        return res.status(400).json({ 
          success: false, 
          message: "Esta solicitação já foi processada" 
        });
      }
      
      // Atualizar a solicitação
      const [updatedRequest] = await db
        .update(withdrawalRequests)
        .set({
          status,
          notes: admin_notes || null,
          processed_at: new Date()
        })
        .where(eq(withdrawalRequests.id, requestId))
        .returning();
      
      // Se aprovado, deduzir do saldo do lojista
      if (status === WithdrawalStatus.COMPLETED) {
        await db
          .update(cashbacks)
          .set({
            balance: sql`balance - ${existingRequest.amount}`,
            updated_at: new Date()
          })
          .where(eq(cashbacks.user_id, existingRequest.user_id));
      }
      
      // Enviar notificação para o lojista
      await createWithdrawalRequestNotification({
        userId: existingRequest.user_id,
        status,
        amount: existingRequest.amount,
        reason: admin_notes
      });
      
      res.json({
        success: true,
        withdrawalRequest: updatedRequest
      });
    } catch (error) {
      console.error("Erro ao processar solicitação de saque:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro ao processar solicitação de saque"
      });
    }
  });
}