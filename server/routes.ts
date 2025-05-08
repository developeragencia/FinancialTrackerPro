import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rota de verificação do usuário atual
  app.get("/api/auth/me", (req, res) => {
    // Normalmente aqui teríamos verificação de sessão
    // Como é um exemplo, retornaremos um status 401 para simular que o usuário não está logado
    res.status(401).json({ message: "Usuário não autenticado" });
  });

  // Rota de login
  app.post("/api/auth/login", async (req, res) => {
    const { email, password, type } = req.body;
    
    try {
      // Busca usuário pelo email
      const user = await storage.getUserByUsername(email);
      
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      // Verifica se o tipo de usuário corresponde
      if (user.type !== type) {
        return res.status(401).json({ 
          message: "Tipo de usuário incorreto. Por favor, selecione o tipo correto." 
        });
      }
      
      // Verifica a senha
      if (user.password !== password) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      // Retorna os dados do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Erro no login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota de registro
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = req.body;
      
      // Verificar se o email já existe
      const existingUser = await storage.getUserByUsername(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está em uso" });
      }
      
      // Criar o usuário
      const newUser = await storage.createUser(userData);
      
      // Retorna os dados do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Erro no registro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rota de logout
  app.post("/api/auth/logout", (req, res) => {
    // Em uma aplicação real, invalidaríamos a sessão
    res.status(200).json({ message: "Logout realizado com sucesso" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
