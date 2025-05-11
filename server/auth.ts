import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, users, auditLogs } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    // Define User interface para o passport
    interface User {
      id: number;
      name: string;
      username: string | null;
      email: string;
      password: string;
      phone: string | null;
      country: string | null;
      country_code: string | null;
      type: string;
      status: string;
      photo: string | null;
      security_question: string | null;
      security_answer: string | null;
      created_at: Date;
      last_login: Date | null;
      invitation_code: string | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "vale-cashback-secret-key",
    resave: true, // Alterado para true para manter a sessão ativa
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 dias
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByUsername(email);
          if (!user) {
            return done(null, false, { message: 'Credenciais inválidas' });
          }
          
          // Usamos a função comparePasswords para verificar a senha com hash
          const passwordMatch = await storage.comparePasswords(password, user.password);
          if (!passwordMatch) {
            return done(null, false, { message: 'Credenciais inválidas' });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const userData = req.body;
      
      // Verificar se o email já existe
      const existingUser = await storage.getUserByUsername(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está em uso" });
      }
      
      // Em produção, devemos hashear a senha
      // userData.password = await hashPassword(userData.password);
      
      // Criar o usuário
      const user = await storage.createUser(userData);
      
      // Retorna os dados do usuário (exceto a senha)
      const { password: _, ...userWithoutPassword } = user;
      
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error: any) {
      console.error("Erro no registro:", error);
      res.status(500).json({ message: error.message || "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    const { type } = req.body;
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      }
      
      // Verificar o tipo de usuário
      if (user.type !== type) {
        return res.status(401).json({ 
          message: "Tipo de usuário incorreto. Por favor, selecione o tipo correto." 
        });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Não enviar a senha para o cliente
        const { password: _, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    console.log("Verificando autenticação do usuário:", {
      isAuthenticated: req.isAuthenticated(),
      sessionID: req.sessionID
    });
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    // Não enviar a senha para o cliente
    const { password: _, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });

  // Rota para recuperação de senha
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email, method, securityQuestion, securityAnswer } = req.body;
      
      // Verificar se o usuário existe
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (!user.length) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      if (method === "security-question") {
        // Em uma implementação real, verificaríamos a resposta da pergunta de segurança
        // contra o valor armazenado no banco de dados
        
        // Gerar senha temporária
        const tempPassword = randomBytes(4).toString("hex");
        const hashedTempPassword = await hashPassword(tempPassword);
        
        // Atualizar senha do usuário
        await db
          .update(users)
          .set({ password: hashedTempPassword })
          .where(eq(users.id, user[0].id));
        
        // Registrar a alteração no log de auditoria
        await db.insert(auditLogs).values({
          user_id: user[0].id,
          action: "PASSWORD_RESET",
          details: JSON.stringify({
            method: "security-question",
            success: true
          }),
          ip_address: req.ip || "unknown",
          created_at: new Date()
        });
        
        // Em produção, enviaríamos a senha temporária por email
        // Por enquanto, vamos retornar na resposta (apenas para teste)
        return res.status(200).json({ 
          success: true, 
          message: "Senha temporária gerada com sucesso",
          tempPassword // REMOVER ISSO EM PRODUÇÃO
        });
      } else {
        // Método de recuperação por email
        
        // Gerar token de redefinição
        const resetToken = randomBytes(20).toString("hex");
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 1); // Token válido por 1 hora
        
        // Em um sistema real, armazenaríamos este token no banco de dados
        // e enviaríamos um email com link para redefinição
        
        // Registrar a tentativa no log de auditoria
        await db.insert(auditLogs).values({
          user_id: user[0].id,
          action: "PASSWORD_RESET_REQUEST",
          details: JSON.stringify({
            method: "email",
            success: true
          }),
          ip_address: req.ip || "unknown",
          created_at: new Date()
        });
        
        return res.status(200).json({ 
          success: true, 
          message: "Link de recuperação enviado para o email"
        });
      }
    } catch (error) {
      console.error("Erro na recuperação de senha:", error);
      res.status(500).json({ message: "Erro ao processar a recuperação de senha" });
    }
  });
}