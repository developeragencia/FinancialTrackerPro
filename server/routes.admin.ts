import { eq, ne, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { Express, Request, Response } from "express";
import { 
  merchants, 
  users, 
  transactions,
  commissionSettings
} from "@shared/schema";

// Adicione isso ao arquivo de rotas principal
export function addAdminRoutes(app: Express) {
  // API para listar lojas para o painel de administração
  app.get("/api/admin/stores", async (req, res) => {
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
}

// Adicione isso ao arquivo de rotas principal
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