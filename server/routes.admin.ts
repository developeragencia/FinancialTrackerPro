import { eq, ne, and, desc, asc, sql, count, sum, isNull, isNotNull, or, like } from "drizzle-orm";
import { db } from "./db";
import { Express, Request, Response } from "express";
import { 
  merchants, 
  users, 
  transactions,
  commissionSettings,
  auditLogs,
  transfers,
  transactionItems,
  cashbacks,
  referrals,
  qrCodes,
  settings
} from "@shared/schema";
import { isUserType } from "./routes";
import { formatCurrency } from "../client/src/lib/utils";

// Rotas administrativas
export function addAdminRoutes(app: Express) {
  // Dashboard do admin - estatísticas
  app.get("/api/admin/dashboard", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    try {
      // Contagem de usuários
      const [userCount] = await db
        .select({ count: count() })
        .from(users);
        
      // Contagem de lojistas
      const [merchantCount] = await db
        .select({ count: count() })
        .from(merchants);
        
      // Transações totais
      const [transactionCount] = await db
        .select({ count: count() })
        .from(transactions);
        
      // Valor total de transações
      const [transactionTotal] = await db
        .select({ 
          total: sql`COALESCE(sum(${transactions.total_amount}), 0)` 
        })
        .from(transactions);
        
      // Transferências pendentes
      const [pendingTransfersCount] = await db
        .select({ count: count() })
        .from(transfers)
        .where(eq(transfers.status, 'pending'));
        
      // Último log do sistema
      const [lastLog] = await db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.created_at))
        .limit(1);
      
      // Retornar todos os dados combinados
      res.json({
        userCount: userCount?.count?.toString() || "0",
        merchantCount: merchantCount?.count?.toString() || "0", 
        transactionCount: transactionCount?.count?.toString() || "0",
        transactionTotal: transactionTotal?.total?.toString() || "0",
        pendingTransfersCount: pendingTransfersCount?.count?.toString() || "0",
        lastLog: lastLog || null
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard admin:", error);
      res.status(500).json({ message: "Erro ao carregar dados do dashboard" });
    }
  });

  // API para listar lojas para o painel de administração
  app.get("/api/admin/stores", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    try {
      const storesResult = await db
        .select({
          id: merchants.id,
          store_name: merchants.store_name,
          logo: merchants.logo,
          category: merchants.category,
          address: merchants.address,
          city: merchants.city,
          state: merchants.state,
          commission_rate: merchants.commission_rate,
          approved: merchants.approved,
          created_at: merchants.created_at,
          user_id: users.id,
          email: users.email,
          phone: users.phone,
          owner_name: users.name,
          type: users.type
        })
        .from(merchants)
        .innerJoin(users, eq(merchants.user_id, users.id))
        .orderBy(merchants.store_name);
      
      // Formatar para o frontend
      const stores = storesResult.map(store => ({
        id: store.id,
        storeId: store.id,
        userId: store.user_id,
        store_name: store.store_name,
        name: store.store_name,
        logo: store.logo || null,
        category: store.category || 'Geral',
        description: '', // Campo vazio pois não existe na tabela
        address: store.address,
        city: store.city,
        state: store.state,
        ownerName: store.owner_name,
        email: store.email,
        phone: store.phone,
        commissionRate: store.commission_rate,
        approved: store.approved,
        rating: 5.0, // Valor padrão para todas as lojas no momento
        createdAt: store.created_at
      }));
      
      res.json(stores);
    } catch (error) {
      console.error("Erro ao listar lojas para administração:", error);
      res.status(500).json({ message: "Erro ao listar lojas" });
    }
  });
  
  // Aprovar/rejeitar uma loja
  app.patch("/api/admin/stores/:id/approve", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    const storeId = parseInt(req.params.id);
    const { approved } = req.body;
    
    if (isNaN(storeId)) {
      return res.status(400).json({ message: "ID de loja inválido" });
    }
    
    try {
      // Atualizar o status da loja
      await db
        .update(merchants)
        .set({ 
          approved: approved === true,
          updated_at: new Date() 
        })
        .where(eq(merchants.id, storeId));
      
      // Registrar no log de auditoria
      await db.insert(auditLogs).values({
        action: approved ? "store_approved" : "store_rejected",
        entity_type: "merchant",
        entity_id: storeId,
        user_id: req.user.id,
        details: JSON.stringify({
          storeId,
          approved
        }),
        created_at: new Date()
      });
      
      res.json({ 
        success: true, 
        message: approved ? "Loja aprovada com sucesso" : "Loja rejeitada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao atualizar status da loja:", error);
      res.status(500).json({ message: "Erro ao atualizar status da loja" });
    }
  });
  
  // Listar todas as transações para administrador
  app.get("/api/admin/transactions", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const offset = (page - 1) * pageSize;
      
      // Obter transações com informações de loja e cliente
      const transactionsResult = await db
        .select({
          id: transactions.id,
          merchant_id: transactions.merchant_id,
          user_id: transactions.user_id,
          total_amount: transactions.total_amount,
          status: transactions.status,
          payment_method: transactions.payment_method,
          created_at: transactions.created_at,
          merchant_name: merchants.store_name,
          merchant_logo: merchants.logo,
          user_name: users.name
        })
        .from(transactions)
        .leftJoin(merchants, eq(transactions.merchant_id, merchants.id))
        .leftJoin(users, eq(transactions.user_id, users.id))
        .orderBy(desc(transactions.created_at))
        .limit(pageSize)
        .offset(offset);
      
      // Contar total de transações para paginação
      const [totalCount] = await db
        .select({ count: count() })
        .from(transactions);
      
      // Calcular valores adicionais (total, taxas, etc)
      const transactionsWithDetails = await Promise.all(transactionsResult.map(async (tx) => {
        // Obter itens da transação
        const items = await db
          .select()
          .from(transactionItems)
          .where(eq(transactionItems.transaction_id, tx.id));
        
        // Obter cashbacks relacionados
        const cashbackEntry = await db
          .select()
          .from(cashbacks)
          .where(eq(cashbacks.transaction_id, tx.id));
        
        return {
          id: tx.id,
          merchant: {
            id: tx.merchant_id,
            name: tx.merchant_name,
            logo: tx.merchant_logo
          },
          customer: {
            id: tx.user_id,
            name: tx.user_name
          },
          totalAmount: tx.total_amount,
          status: tx.status,
          paymentMethod: tx.payment_method,
          items: items.length,
          createdAt: tx.created_at,
          cashbackAmount: cashbackEntry.length > 0 ? cashbackEntry[0].amount : 0
        };
      }));
      
      res.json({
        transactions: transactionsWithDetails,
        pagination: {
          total: totalCount?.count || 0,
          page,
          pageSize,
          pageCount: Math.ceil((totalCount?.count || 0) / pageSize)
        }
      });
    } catch (error) {
      console.error("Erro ao listar transações:", error);
      res.status(500).json({ message: "Erro ao listar transações" });
    }
  });
  
  // Obter detalhes de uma transação específica
  app.get("/api/admin/transactions/:id", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    const transactionId = parseInt(req.params.id);
    
    if (isNaN(transactionId)) {
      return res.status(400).json({ message: "ID de transação inválido" });
    }
    
    try {
      // Obter transação base
      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId));
      
      if (!transaction) {
        return res.status(404).json({ message: "Transação não encontrada" });
      }
      
      // Obter informações do lojista
      const [merchant] = await db
        .select()
        .from(merchants)
        .where(eq(merchants.id, transaction.merchant_id));
      
      // Obter informações do cliente
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, transaction.user_id));
      
      // Obter itens da transação
      const items = await db
        .select()
        .from(transactionItems)
        .where(eq(transactionItems.transaction_id, transactionId));
      
      // Obter cashback relacionado
      const [cashbackEntry] = await db
        .select()
        .from(cashbacks)
        .where(eq(cashbacks.transaction_id, transactionId));
      
      // Obter taxas e comissões ativas no momento da transação
      const [commissionSettingsEntry] = await db
        .select()
        .from(commissionSettings)
        .orderBy(desc(commissionSettings.created_at))
        .limit(1);
      
      // Montar objeto de resposta detalhado
      const response = {
        id: transaction.id,
        reference: transaction.reference || `TX-${transaction.id}`,
        merchant: {
          id: merchant?.id,
          name: merchant?.store_name,
          logo: merchant?.logo
        },
        customer: {
          id: user?.id,
          name: user?.name,
          email: user?.email
        },
        amount: {
          total: transaction.total_amount,
          subtotal: transaction.subtotal || transaction.total_amount,
          tax: transaction.tax || 0,
          discount: transaction.discount || 0,
          cashback: cashbackEntry?.amount || 0
        },
        fees: {
          platform: commissionSettingsEntry?.platform_fee || "2.0",
          merchant: commissionSettingsEntry?.merchant_commission || "2.0",
          cashback: commissionSettingsEntry?.cashback_rate || "2.0",
          referral: commissionSettingsEntry?.referral_bonus || "1.0"
        },
        payment: {
          method: transaction.payment_method,
          status: transaction.status
        },
        items: items.map(item => ({
          id: item.id,
          name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          total: (item.price || 0) * (item.quantity || 1)
        })),
        timestamps: {
          created: transaction.created_at,
          updated: transaction.updated_at
        }
      };
      
      res.json(response);
    } catch (error) {
      console.error("Erro ao obter detalhes da transação:", error);
      res.status(500).json({ message: "Erro ao obter detalhes da transação" });
    }
  });
  
  // Listar todas as transferências
  app.get("/api/admin/transfers", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const status = req.query.status as string || null;
      const offset = (page - 1) * pageSize;
      
      let query = db
        .select({
          id: transfers.id,
          user_id: transfers.user_id,
          amount: transfers.amount,
          status: transfers.status,
          created_at: transfers.created_at,
          updated_at: transfers.updated_at,
          user_name: users.name,
          user_email: users.email,
          user_type: users.type
        })
        .from(transfers)
        .leftJoin(users, eq(transfers.user_id, users.id))
        .orderBy(desc(transfers.created_at));
      
      // Filtrar por status, se fornecido
      if (status) {
        query = query.where(eq(transfers.status, status));
      }
      
      const transfersResult = await query
        .limit(pageSize)
        .offset(offset);
      
      // Contar total de transferências para paginação
      let countQuery = db
        .select({ count: count() })
        .from(transfers);
        
      if (status) {
        countQuery = countQuery.where(eq(transfers.status, status));
      }
      
      const [totalCount] = await countQuery;
      
      // Formatar resposta
      const transfersFormatted = transfersResult.map(transfer => ({
        id: transfer.id,
        userId: transfer.user_id,
        userName: transfer.user_name,
        userEmail: transfer.user_email,
        userType: transfer.user_type,
        amount: transfer.amount,
        status: transfer.status,
        createdAt: transfer.created_at,
        updatedAt: transfer.updated_at
      }));
      
      res.json({
        transfers: transfersFormatted,
        pagination: {
          total: totalCount?.count || 0,
          page,
          pageSize,
          pageCount: Math.ceil((totalCount?.count || 0) / pageSize)
        }
      });
    } catch (error) {
      console.error("Erro ao listar transferências:", error);
      res.status(500).json({ message: "Erro ao listar transferências" });
    }
  });
  
  // Aprovar ou rejeitar uma transferência
  app.patch("/api/admin/transfers/:id/status", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    const transferId = parseInt(req.params.id);
    const { status, notes } = req.body;
    
    if (isNaN(transferId)) {
      return res.status(400).json({ message: "ID de transferência inválido" });
    }
    
    if (!status || !['approved', 'rejected', 'processing', 'completed'].includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }
    
    try {
      // Obter transferência atual
      const [transfer] = await db
        .select()
        .from(transfers)
        .where(eq(transfers.id, transferId));
      
      if (!transfer) {
        return res.status(404).json({ message: "Transferência não encontrada" });
      }
      
      // Atualizar status da transferência
      await db
        .update(transfers)
        .set({ 
          status: status,
          notes: notes || transfer.notes,
          updated_at: new Date(),
          updated_by: req.user.id
        })
        .where(eq(transfers.id, transferId));
      
      // Registrar no log de auditoria
      await db.insert(auditLogs).values({
        action: `transfer_${status}`,
        entity_type: "transfer",
        entity_id: transferId,
        user_id: req.user.id,
        details: JSON.stringify({
          transferId,
          previousStatus: transfer.status,
          newStatus: status,
          notes
        }),
        created_at: new Date()
      });
      
      res.json({ 
        success: true, 
        message: `Transferência ${
          status === 'approved' ? 'aprovada' : 
          status === 'rejected' ? 'rejeitada' : 
          status === 'processing' ? 'em processamento' :
          status === 'completed' ? 'completada' : 'atualizada'
        } com sucesso` 
      });
    } catch (error) {
      console.error("Erro ao atualizar status da transferência:", error);
      res.status(500).json({ message: "Erro ao atualizar status da transferência" });
    }
  });
  
  // Listar logs de auditoria
  app.get("/api/admin/logs", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;
      
      const logsResult = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entity_type: auditLogs.entity_type,
          entity_id: auditLogs.entity_id,
          user_id: auditLogs.user_id,
          details: auditLogs.details,
          created_at: auditLogs.created_at,
          user_name: users.name,
          user_email: users.email
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.user_id, users.id))
        .orderBy(desc(auditLogs.created_at))
        .limit(pageSize)
        .offset(offset);
      
      // Contar total de logs para paginação
      const [totalCount] = await db
        .select({ count: count() })
        .from(auditLogs);
      
      // Formatar logs com detalhes mais legíveis
      const logs = logsResult.map(log => {
        let parsedDetails;
        try {
          parsedDetails = JSON.parse(log.details || '{}');
        } catch (e) {
          parsedDetails = {};
        }
        
        // Traduzir ações para descrições mais amigáveis
        const actionDescriptions: Record<string, string> = {
          'user_created': 'Usuário criado',
          'user_updated': 'Usuário atualizado',
          'user_deleted': 'Usuário removido',
          'store_approved': 'Loja aprovada',
          'store_rejected': 'Loja rejeitada',
          'transfer_approved': 'Transferência aprovada',
          'transfer_rejected': 'Transferência rejeitada',
          'transfer_processing': 'Transferência em processamento',
          'transfer_completed': 'Transferência concluída',
          'transaction_created': 'Transação criada',
          'transaction_updated': 'Transação atualizada',
          'settings_updated': 'Configurações atualizadas',
          'login_success': 'Login bem-sucedido',
          'login_failed': 'Tentativa de login falhou',
          'password_reset': 'Senha redefinida'
        };
        
        return {
          id: log.id,
          action: log.action,
          actionDescription: actionDescriptions[log.action] || log.action,
          entityType: log.entity_type,
          entityId: log.entity_id,
          user: {
            id: log.user_id,
            name: log.user_name || 'Sistema',
            email: log.user_email
          },
          details: parsedDetails,
          createdAt: log.created_at
        };
      });
      
      res.json({
        logs,
        pagination: {
          total: totalCount?.count || 0,
          page,
          pageSize,
          pageCount: Math.ceil((totalCount?.count || 0) / pageSize)
        }
      });
    } catch (error) {
      console.error("Erro ao listar logs de auditoria:", error);
      res.status(500).json({ message: "Erro ao listar logs de auditoria" });
    }
  });
  
  // Obter todas as configurações do sistema
  app.get("/api/admin/settings", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    try {
      // Obter configurações de comissão mais recentes
      const [commissionSetting] = await db
        .select()
        .from(commissionSettings)
        .orderBy(desc(commissionSettings.created_at))
        .limit(1);
      
      // Obter outras configurações do sistema
      const systemSettings = await db
        .select()
        .from(settings);
      
      // Converter configurações para formato mais amigável para o frontend
      const formattedSettings: Record<string, any> = {};
      
      systemSettings.forEach(setting => {
        try {
          formattedSettings[setting.key] = JSON.parse(setting.value);
        } catch {
          formattedSettings[setting.key] = setting.value;
        }
      });
      
      // Adicionar configurações de comissão
      if (commissionSetting) {
        formattedSettings.commission = {
          platformFee: commissionSetting.platform_fee,
          merchantCommission: commissionSetting.merchant_commission,
          cashbackRate: commissionSetting.cashback_rate,
          referralBonus: commissionSetting.referral_bonus,
          updatedAt: commissionSetting.created_at
        };
      }
      
      res.json(formattedSettings);
    } catch (error) {
      console.error("Erro ao obter configurações do sistema:", error);
      res.status(500).json({ message: "Erro ao obter configurações do sistema" });
    }
  });
  
  // Obter configurações de taxas e comissões
  app.get("/api/admin/settings/rates", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    try {
      const [commissionSetting] = await db
        .select()
        .from(commissionSettings)
        .orderBy(desc(commissionSettings.created_at))
        .limit(1);
      
      if (!commissionSetting) {
        // Se não existir, criar com valores padrão
        const [newSettings] = await db
          .insert(commissionSettings)
          .values({
            platform_fee: "2.0",
            merchant_commission: "2.0",
            cashback_rate: "2.0",
            referral_bonus: "1.0",
            created_at: new Date(),
            created_by: req.user.id
          })
          .returning();
          
        res.json(newSettings);
      } else {
        res.json(commissionSetting);
      }
    } catch (error) {
      console.error("Erro ao obter configurações de taxas:", error);
      res.status(500).json({ message: "Erro ao obter configurações de taxas" });
    }
  });
  
  // Atualizar configurações de taxas e comissões
  app.post("/api/admin/settings/rates", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    const { platform_fee, merchant_commission, cashback_rate, referral_bonus } = req.body;
    
    // Validar valores
    if (!platform_fee || !merchant_commission || !cashback_rate || !referral_bonus) {
      return res.status(400).json({ message: "Todos os campos são obrigatórios" });
    }
    
    try {
      // Inserir novas configurações mantendo histórico
      const [newSettings] = await db
        .insert(commissionSettings)
        .values({
          platform_fee: platform_fee.toString(),
          merchant_commission: merchant_commission.toString(),
          cashback_rate: cashback_rate.toString(),
          referral_bonus: referral_bonus.toString(),
          created_at: new Date(),
          created_by: req.user.id
        })
        .returning();
      
      // Registrar no log de auditoria
      await db.insert(auditLogs).values({
        action: "settings_updated",
        entity_type: "commission_settings",
        entity_id: newSettings.id,
        user_id: req.user.id,
        details: JSON.stringify({
          platform_fee,
          merchant_commission,
          cashback_rate,
          referral_bonus
        }),
        created_at: new Date()
      });
      
      res.json({
        success: true,
        message: "Configurações de taxas atualizadas com sucesso",
        settings: newSettings
      });
    } catch (error) {
      console.error("Erro ao atualizar configurações de taxas:", error);
      res.status(500).json({ message: "Erro ao atualizar configurações de taxas" });
    }
  });
  
  // Listar usuários (clientes e lojistas)
  app.get("/api/admin/users", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const userType = req.query.type as string;
      const search = req.query.search as string;
      const offset = (page - 1) * pageSize;
      
      let query = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          username: users.username,
          type: users.type,
          status: users.status,
          created_at: users.created_at,
          last_login: users.last_login,
          invitation_code: users.invitation_code
        })
        .from(users)
        .orderBy(desc(users.created_at));
      
      // Filtrar por tipo se especificado
      if (userType && ['client', 'merchant', 'admin'].includes(userType)) {
        query = query.where(eq(users.type, userType));
      }
      
      // Busca por nome ou email
      if (search) {
        query = query.where(
          or(
            like(users.name, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.username || '', `%${search}%`)
          )
        );
      }
      
      const usersResult = await query
        .limit(pageSize)
        .offset(offset);
      
      // Contar total de usuários para paginação
      let countQuery = db
        .select({ count: count() })
        .from(users);
        
      if (userType && ['client', 'merchant', 'admin'].includes(userType)) {
        countQuery = countQuery.where(eq(users.type, userType));
      }
      
      if (search) {
        countQuery = countQuery.where(
          or(
            like(users.name, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.username || '', `%${search}%`)
          )
        );
      }
      
      const [totalCount] = await countQuery;
      
      // Obter informações adicionais para cada usuário
      const usersWithDetails = await Promise.all(usersResult.map(async (user) => {
        // Para lojistas, obter informações da loja
        let merchantInfo = null;
        if (user.type === 'merchant') {
          const [merchantData] = await db
            .select()
            .from(merchants)
            .where(eq(merchants.user_id, user.id));
          
          if (merchantData) {
            merchantInfo = {
              id: merchantData.id,
              name: merchantData.store_name,
              logo: merchantData.logo,
              approved: merchantData.approved
            };
          }
        }
        
        // Contar transações para cada usuário
        const [transactionCount] = await db
          .select({ count: count() })
          .from(transactions)
          .where(eq(transactions.user_id, user.id));
        
        // Para clientes, calcular cashback total
        let cashbackTotal = 0;
        if (user.type === 'client') {
          const [cashbackResult] = await db
            .select({ 
              total: sql`COALESCE(SUM(${cashbacks.amount}), 0)` 
            })
            .from(cashbacks)
            .where(eq(cashbacks.user_id, user.id));
          
          cashbackTotal = cashbackResult?.total || 0;
        }
        
        // Contar indicações
        const [referralCount] = await db
          .select({ count: count() })
          .from(referrals)
          .where(eq(referrals.referrer_id, user.id));
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          type: user.type,
          status: user.status,
          createdAt: user.created_at,
          lastLogin: user.last_login,
          invitationCode: user.invitation_code,
          merchant: merchantInfo,
          stats: {
            transactions: transactionCount?.count || 0,
            cashbackTotal,
            referrals: referralCount?.count || 0
          }
        };
      }));
      
      res.json({
        users: usersWithDetails,
        pagination: {
          total: totalCount?.count || 0,
          page,
          pageSize,
          pageCount: Math.ceil((totalCount?.count || 0) / pageSize)
        }
      });
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      res.status(500).json({ message: "Erro ao listar usuários" });
    }
  });
  
  // Suporte administrativo - tickets e mensagens
  app.get("/api/admin/support", isUserType("admin"), async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    // Como a tabela de tickets não foi definida ainda, retornaremos dados simulados
    // Em uma implementação real, isso seria substituído por consultas ao banco
    const supportTickets = [
      {
        id: 1,
        subject: "Problema com pagamento",
        status: "open",
        priority: "high",
        createdAt: new Date(Date.now() - 86400000), // 1 dia atrás
        user: {
          id: 2,
          name: "Cliente Teste",
          email: "cliente@valecashback.com",
          type: "client"
        },
        messages: [
          {
            id: 1,
            content: "Estou tendo problemas para finalizar o pagamento na loja X.",
            sender: "Cliente Teste",
            createdAt: new Date(Date.now() - 86400000)
          }
        ]
      },
      {
        id: 2,
        subject: "Dúvida sobre cashback",
        status: "pending",
        priority: "medium",
        createdAt: new Date(Date.now() - 172800000), // 2 dias atrás
        user: {
          id: 3,
          name: "Lojista Teste",
          email: "lojista@valecashback.com",
          type: "merchant"
        },
        messages: [
          {
            id: 2,
            content: "Como configurar as taxas de cashback para minha loja?",
            sender: "Lojista Teste",
            createdAt: new Date(Date.now() - 172800000)
          },
          {
            id: 3,
            content: "Você pode acessar essas configurações na aba de Cashback no seu perfil de lojista.",
            sender: "Administrador",
            createdAt: new Date(Date.now() - 86400000)
          }
        ]
      },
      {
        id: 3,
        subject: "Solicitação de nova funcionalidade",
        status: "closed",
        priority: "low",
        createdAt: new Date(Date.now() - 259200000), // 3 dias atrás
        user: {
          id: 3,
          name: "Lojista Teste",
          email: "lojista@valecashback.com",
          type: "merchant"
        },
        messages: [
          {
            id: 4,
            content: "Gostaria de sugerir a implementação de um sistema de descontos especiais.",
            sender: "Lojista Teste",
            createdAt: new Date(Date.now() - 259200000)
          },
          {
            id: 5,
            content: "Agradecemos a sugestão! Vamos avaliar a possibilidade de incluir essa funcionalidade.",
            sender: "Administrador",
            createdAt: new Date(Date.now() - 172800000)
          },
          {
            id: 6,
            content: "Estamos planejando incluir essa funcionalidade na próxima atualização.",
            sender: "Administrador",
            createdAt: new Date(Date.now() - 86400000)
          }
        ]
      }
    ];
    
    // Registrar acesso ao suporte no log de auditoria
    await db.insert(auditLogs).values({
      action: "support_accessed",
      entity_type: "support",
      entity_id: 0,
      user_id: req.user.id,
      details: JSON.stringify({
        timestamp: new Date()
      }),
      created_at: new Date()
    });
    
    res.json({
      tickets: supportTickets,
      stats: {
        total: 3,
        open: 1,
        pending: 1,
        closed: 1
      }
    });
  });
}

// API para listar lojas na visão do cliente
export function addClientRoutes(app: Express) {
  app.get("/api/client/stores", async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Buscar todas as lojas aprovadas
      const storesResult = await db
        .select({
          id: merchants.id,
          store_name: merchants.store_name,
          logo: merchants.logo,
          category: merchants.category,
          address: merchants.address,
          city: merchants.city,
          state: merchants.state,
          commission_rate: merchants.commission_rate,
          created_at: merchants.created_at,
          user_id: users.id,
          email: users.email,
          phone: users.phone,
          owner_name: users.name
        })
        .from(merchants)
        .innerJoin(users, eq(merchants.user_id, users.id))
        .where(eq(merchants.approved, true))
        .orderBy(merchants.store_name);
      
      // Formatar para o frontend com melhor apresentação
      const stores = storesResult.map(store => ({
        id: store.id,
        storeId: store.id,
        userId: store.user_id,
        name: store.store_name,
        store_name: store.store_name,
        logo: store.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(store.store_name)}&background=random&color=fff&size=128`,
        category: store.category || 'Geral',
        description: '', // Campo vazio pois não existe na tabela
        address: store.address,
        city: store.city,
        state: store.state,
        ownerName: store.owner_name,
        email: store.email,
        phone: store.phone,
        commissionRate: store.commission_rate,
        rating: 5.0, // Valor padrão para todas as lojas no momento
        createdAt: store.created_at
      }));
      
      res.json(stores);
    } catch (error) {
      console.error("Erro ao listar lojas para o cliente:", error);
      res.status(500).json({ message: "Erro ao listar lojas" });
    }
  });
}

// Rotas do lojista
export function addMerchantRoutes(app: Express) {
  // API para listar lojas na visão do lojista
  app.get("/api/merchant/stores", async (req, res) => {
    try {
      // Obter o ID do lojista atual
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      const currentMerchantId = req.user.id;

      // Buscar todas as lojas ativas exceto a do próprio lojista
      const storesResult = await db
        .select({
          id: merchants.id,
          store_name: merchants.store_name,
          logo: merchants.logo,
          category: merchants.category,
          address: merchants.address,
          city: merchants.city,
          state: merchants.state,
          commission_rate: merchants.commission_rate,
          created_at: merchants.created_at,
          user_id: users.id,
          email: users.email,
          phone: users.phone,
          owner_name: users.name,
          type: users.type
        })
        .from(merchants)
        .innerJoin(users, eq(merchants.user_id, users.id))
        .where(and(
          eq(merchants.approved, true),
          ne(users.id, currentMerchantId)
        ))
        .orderBy(merchants.store_name);
      
      // Formatar para o frontend
      const stores = storesResult.map(store => ({
        id: store.id,
        storeId: store.id,
        userId: store.user_id,
        store_name: store.store_name,
        name: store.store_name,
        logo: store.logo || null,
        category: store.category || 'Geral',
        description: '', // Campo vazio pois não existe na tabela
        address: store.address,
        city: store.city,
        state: store.state,
        ownerName: store.owner_name,
        email: store.email,
        phone: store.phone,
        commissionRate: store.commission_rate,
        rating: 5.0, // Valor padrão para todas as lojas no momento
        createdAt: store.created_at
      }));
      
      res.json(stores);
    } catch (error) {
      console.error("Erro ao listar lojas para o lojista:", error);
      res.status(500).json({ message: "Erro ao listar lojas" });
    }
  });
}