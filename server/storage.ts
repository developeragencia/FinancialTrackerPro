import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Inicializa os usuários padrão se não existirem
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers() {
    try {
      // Verificar se já existem usuários
      const existingUsers = await db.select().from(users).limit(1);
      
      if (existingUsers.length === 0) {
        // Criar usuários padrão
        const adminUser: InsertUser = {
          name: "Administrador",
          email: "admin@valecashback.com",
          password: "senha123", // Em produção usaríamos hash
          type: "admin",
          status: "active",
          phone: null,
          cpfCnpj: null,
          photo: null,
        };
        
        const clientUser: InsertUser = {
          name: "Cliente Teste",
          email: "cliente@valecashback.com",
          password: "senha123",
          type: "client",
          status: "active",
          phone: "(11) 98765-4321",
          cpfCnpj: "123.456.789-00",
          photo: null,
        };
        
        const merchantUser: InsertUser = {
          name: "Lojista Teste",
          email: "lojista@valecashback.com",
          password: "senha123",
          type: "merchant",
          status: "active",
          phone: "(11) 3456-7890",
          cpfCnpj: "12.345.678/0001-90",
          photo: null,
        };
        
        await this.createUser(adminUser);
        await this.createUser(clientUser);
        await this.createUser(merchantUser);
        
        console.log("Usuários padrão criados com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao inicializar usuários padrão:", error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(eq(users.id, id));
    
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select()
      .from(users)
      .where(eq(users.email, username));
    
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Garantindo que todos os campos obrigatórios estejam preenchidos
    const userWithDefaults = {
      ...insertUser,
      status: insertUser.status || "active",
      phone: insertUser.phone || null,
      cpfCnpj: insertUser.cpfCnpj || null,
      photo: insertUser.photo || null,
    };

    const result = await db.insert(users)
      .values(userWithDefaults)
      .returning();
    
    return result[0];
  }
}

export const storage = new DatabaseStorage();