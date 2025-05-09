import { eq, and, or, desc, asc, sql, count, isNull } from "drizzle-orm";
import { db } from "./db";
import { Express, Request, Response } from "express";
import { 
  withdrawalRequests, 
  merchants, 
  users, 
  auditLogs, 
  WithdrawalStatus
} from "@shared/schema";
import { isUserType } from "./routes";
import { createWithdrawalRequestNotification, createAdminWithdrawalNotification } from "./helpers/notification";

// Função para validar os dados da solicitação de saque
function validateWithdrawalData(data: any) {
  const errors = [];
  
  if (!data.amount || parseFloat(data.amount) <= 0) {
    errors.push("Valor do saque deve ser maior que zero");
  }
  
  if (!data.full_name || data.full_name.trim().length < 3) {
    errors.push("Nome completo é obrigatório e deve ter pelo menos 3 caracteres");
  }
  
  if (!data.store_name || data.store_name.trim().length < 3) {
    errors.push("Nome da loja é obrigatório e deve ter pelo menos 3 caracteres");
  }
  
  if (!data.phone || data.phone.trim().length < 8) {
    errors.push("Telefone é obrigatório e deve ser válido");
  }
  
  if (!data.email || !data.email.includes('@') || !data.email.includes('.')) {
    errors.push("Email é obrigatório e deve ser válido");
  }
  
  if (!data.bank_name || data.bank_name.trim().length < 2) {
    errors.push("Nome do banco é obrigatório");
  }
  
  if (!data.agency || data.agency.trim().length < 2) {
    errors.push("Agência é obrigatória");
  }
  
  if (!data.account || data.account.trim().length < 3) {
    errors.push("Conta é obrigatória");
  }
  
  if (!data.payment_method || !['bank', 'zelle'].includes(data.payment_method)) {
    errors.push("Método de pagamento deve ser 'bank' ou 'zelle'");
  }
  
  return errors;
}

// Exportar as rotas para serem usadas em routes.ts
export function addWithdrawalRoutes(app: Express) {
  // ROTAS PARA LOJISTAS
  
  // Criar uma nova solicitação de saque
  app.post("/api/merchant/withdrawal-requests", isUserType("merchant"), async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    try {
      const userId = req.user.id;
      
      // Buscar o lojista associado ao usuário
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId));
      
      if (!merchant) {
        return res.status(404).json({ message: "Perfil de lojista não encontrado" });
      }
      
      // Validar os dados da solicitação
      const withdrawalData = req.body;
      const validationErrors = validateWithdrawalData(withdrawalData);
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: validationErrors 
        });
      }
      
      // Criar a solicitação de saque
      const [withdrawal] = await db
        .insert(withdrawalRequests)
        .values({
          user_id: userId,
          merchant_id: merchant.id,
          amount: withdrawalData.amount,
          full_name: withdrawalData.full_name,
          store_name: withdrawalData.store_name,
          phone: withdrawalData.phone,
          email: withdrawalData.email,
          bank_name: withdrawalData.bank_name,
          agency: withdrawalData.agency,
          account: withdrawalData.account,
          payment_method: withdrawalData.payment_method,
          status: WithdrawalStatus.PENDING,
          created_at: new Date(),
          updated_at: new Date()
        })
        .returning();
      
      // Registrar no log de auditoria
      await db.insert(auditLogs).values({
        action: "withdrawal_requested",
        user_id: userId,
        entity_id: withdrawal.id,
        entity_type: "withdrawal",
        details: JSON.stringify({
          amount: withdrawal.amount,
          merchantId: merchant.id,
          merchantName: merchant.store_name
        }),
        created_at: new Date()
      });
      
      // Criar notificação para o lojista
      await createWithdrawalRequestNotification(
        userId,
        withdrawal.id,
        WithdrawalStatus.PENDING,
        withdrawal.amount
      );
      
      // Criar notificação para os administradores
      await createAdminWithdrawalNotification(
        merchant.id,
        merchant.store_name,
        withdrawal.id,
        withdrawal.amount
      );
      
      res.status(201).json({ 
        success: true, 
        message: "Solicitação de saque enviada com sucesso", 
        withdrawal 
      });
      
    } catch (error) {
      console.error("Erro ao criar solicitação de saque:", error);
      res.status(500).json({ message: "Erro ao processar solicitação de saque" });
    }
  });
  
  // Obter histórico de solicitações de saque do lojista
  app.get("/api/merchant/withdrawal-requests", isUserType("merchant"), async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    try {
      const userId = req.user.id;
      
      // Buscar o lojista associado ao usuário
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.user_id, userId));
      
      if (!merchant) {
        return res.status(404).json({ message: "Perfil de lojista não encontrado" });
      }
      
      // Buscar todas as solicitações de saque do lojista
      const withdrawalList = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.merchant_id, merchant.id))
        .orderBy(desc(withdrawalRequests.created_at));
      
      // Obter informações de processamento para solicitações concluídas ou recusadas
      const withdrawalsWithProcessors = await Promise.all(
        withdrawalList.map(async (withdrawal) => {
          if (withdrawal.processed_by) {
            const [processor] = await db
              .select({ name: users.name })
              .from(users)
              .where(eq(users.id, withdrawal.processed_by));
            
            return {
              ...withdrawal,
              processor_name: processor?.name || "Administrador"
            };
          }
          return {
            ...withdrawal,
            processor_name: null
          };
        })
      );
      
      res.json({
        withdrawals: withdrawalsWithProcessors
      });
      
    } catch (error) {
      console.error("Erro ao buscar histórico de saques:", error);
      res.status(500).json({ message: "Erro ao buscar histórico de saques" });
    }
  });
  
  // ROTAS PARA ADMINISTRADORES
  
  // Listar todas as solicitações de saque
  app.get("/api/admin/withdrawal-requests", isUserType("admin"), async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    try {
      const status = req.query.status as string;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const offset = (page - 1) * pageSize;
      
      // Construir a query baseada no filtro de status
      let query = db.select({
        withdrawal: withdrawalRequests,
        merchant_name: merchants.store_name,
        user_name: users.name,
        user_email: users.email
      })
      .from(withdrawalRequests)
      .innerJoin(merchants, eq(withdrawalRequests.merchant_id, merchants.id))
      .innerJoin(users, eq(withdrawalRequests.user_id, users.id));
      
      // Aplicar filtro por status
      if (status && Object.values(WithdrawalStatus).includes(status as any)) {
        query = query.where(eq(withdrawalRequests.status, status));
      }
      
      // Executar a consulta com paginação
      const withdrawalsList = await query
        .limit(pageSize)
        .offset(offset)
        .orderBy(desc(withdrawalRequests.created_at));
      
      // Contar o total de registros para paginação
      const [totalCount] = await db
        .select({ count: count() })
        .from(withdrawalRequests);
      
      // Preparar os dados para o frontend
      const formattedWithdrawals = withdrawalsList.map(item => ({
        id: item.withdrawal.id,
        user_id: item.withdrawal.user_id,
        merchant_id: item.withdrawal.merchant_id,
        amount: item.withdrawal.amount,
        full_name: item.withdrawal.full_name,
        store_name: item.withdrawal.store_name,
        merchant_name: item.merchant_name,
        user_name: item.user_name,
        user_email: item.user_email,
        phone: item.withdrawal.phone,
        email: item.withdrawal.email,
        bank_name: item.withdrawal.bank_name,
        agency: item.withdrawal.agency,
        account: item.withdrawal.account,
        payment_method: item.withdrawal.payment_method,
        status: item.withdrawal.status,
        notes: item.withdrawal.notes,
        processed_by: item.withdrawal.processed_by,
        processed_at: item.withdrawal.processed_at,
        created_at: item.withdrawal.created_at,
        updated_at: item.withdrawal.updated_at
      }));
      
      res.json({
        withdrawals: formattedWithdrawals,
        totalCount: totalCount?.count || 0,
        totalPages: Math.ceil((totalCount?.count || 0) / pageSize),
        currentPage: page
      });
      
    } catch (error) {
      console.error("Erro ao listar solicitações de saque:", error);
      res.status(500).json({ message: "Erro ao listar solicitações de saque" });
    }
  });
  
  // Processar solicitação de saque (aprovar ou recusar)
  app.patch("/api/admin/withdrawal-requests/:id", isUserType("admin"), async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    try {
      const withdrawalId = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (isNaN(withdrawalId)) {
        return res.status(400).json({ message: "ID de solicitação inválido" });
      }
      
      if (!status || !['completed', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status inválido. Deve ser 'completed' ou 'rejected'" });
      }
      
      // Buscar a solicitação
      const [withdrawal] = await db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.id, withdrawalId));
      
      if (!withdrawal) {
        return res.status(404).json({ message: "Solicitação de saque não encontrada" });
      }
      
      if (withdrawal.status !== WithdrawalStatus.PENDING) {
        return res.status(400).json({ message: "Esta solicitação já foi processada" });
      }
      
      // Atualizar o status da solicitação
      const [updatedWithdrawal] = await db
        .update(withdrawalRequests)
        .set({
          status: status as any,
          notes: notes || null,
          processed_by: req.user.id,
          processed_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(withdrawalRequests.id, withdrawalId))
        .returning();
      
      // Registrar no log de auditoria
      await db.insert(auditLogs).values({
        action: status === 'completed' ? "withdrawal_approved" : "withdrawal_rejected",
        user_id: req.user.id,
        entity_id: withdrawalId,
        entity_type: "withdrawal",
        details: JSON.stringify({
          amount: withdrawal.amount,
          merchantId: withdrawal.merchant_id,
          notes: notes || null
        }),
        created_at: new Date()
      });
      
      // Enviar notificação ao lojista
      await createWithdrawalRequestNotification(
        withdrawal.user_id,
        withdrawalId,
        status as any,
        withdrawal.amount
      );
      
      res.json({
        success: true,
        message: status === 'completed' 
          ? "Solicitação de saque aprovada com sucesso" 
          : "Solicitação de saque recusada",
        withdrawal: updatedWithdrawal
      });
      
    } catch (error) {
      console.error("Erro ao processar solicitação de saque:", error);
      res.status(500).json({ message: "Erro ao processar solicitação de saque" });
    }
  });
}