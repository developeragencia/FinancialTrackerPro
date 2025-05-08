import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";

declare global {
  namespace Express {
    // Define User interface para o passport
    interface User {
      id: number;
      name: string;
      email: string;
      password: string;
      phone: string | null;
      cpfCnpj: string | null;
      type: string;
      status: string;
      photo: string | null;
      createdAt: Date;
      lastLogin: Date | null;
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
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 semana
      sameSite: 'lax',
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
          
          // Em uma aplicação real, usaríamos comparePasswords aqui
          // Por enquanto, estamos comparando diretamente
          if (user.password !== password) {
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Usuário não autenticado" });
    }
    
    // Não enviar a senha para o cliente
    const { password: _, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
}