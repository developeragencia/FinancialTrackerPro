import { users, type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 4; // Começando com ID 4 pois vamos adicionar 3 usuários iniciais
    
    // Adicionando usuários padrão
    const adminUser: User = {
      id: 1,
      name: "Administrador",
      email: "admin@valecashback.com",
      password: "senha123", // Em uma aplicação real, usaríamos hash de senha
      type: "admin",
      status: "active",
      createdAt: new Date(),
      phone: null,
      cpfCnpj: null,
      photo: null,
      lastLogin: null
    };
    
    const clientUser: User = {
      id: 2,
      name: "Cliente Teste",
      email: "cliente@valecashback.com",
      password: "senha123",
      type: "client",
      status: "active",
      createdAt: new Date(),
      phone: "(11) 98765-4321",
      cpfCnpj: "123.456.789-00",
      photo: null,
      lastLogin: null
    };
    
    const merchantUser: User = {
      id: 3,
      name: "Lojista Teste",
      email: "lojista@valecashback.com",
      password: "senha123",
      type: "merchant",
      status: "active",
      createdAt: new Date(),
      phone: "(11) 3456-7890",
      cpfCnpj: "12.345.678/0001-90",
      photo: null,
      lastLogin: null
    };
    
    this.users.set(1, adminUser);
    this.users.set(2, clientUser);
    this.users.set(3, merchantUser);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
