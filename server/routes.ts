import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar autenticação e rotas relacionadas
  setupAuth(app);
  
  // Adicionar outras rotas da aplicação aqui
  // ...

  const httpServer = createServer(app);

  return httpServer;
}
