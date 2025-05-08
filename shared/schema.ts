import { pgTable, text, serial, integer, numeric, boolean, timestamp, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User types enum
export const UserType = {
  CLIENT: "client",
  MERCHANT: "merchant",
  ADMIN: "admin",
} as const;

export type UserTypeValues = typeof UserType[keyof typeof UserType];

// Transaction status enum
export const TransactionStatus = {
  COMPLETED: "completed",
  PENDING: "pending",
  CANCELLED: "cancelled",
} as const;

export type TransactionStatusValues = typeof TransactionStatus[keyof typeof TransactionStatus];

// Payment methods enum
export const PaymentMethod = {
  CASH: "cash",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  CASHBACK: "cashback",
  PIX: "pix",
} as const;

export type PaymentMethodValues = typeof PaymentMethod[keyof typeof PaymentMethod];

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone"),
  cpfCnpj: text("cpf_cnpj").unique(),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  photo: text("photo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
});

// Merchants table (extends users)
export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeName: text("store_name").notNull(),
  logo: text("logo"),
  category: text("category").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  commissionRate: numeric("commission_rate").notNull().default("2.0"),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Cashback balances
export const cashbacks = pgTable("cashbacks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  balance: numeric("balance").notNull().default("0.0"),
  totalEarned: numeric("total_earned").notNull().default("0.0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Products/Services
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price").notNull(),
  category: text("category"),
  inventoryCount: integer("inventory_count"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id),
  amount: numeric("amount").notNull(),
  cashbackAmount: numeric("cashback_amount").notNull(),
  status: text("status").notNull().default("completed"),
  paymentMethod: text("payment_method").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transaction Items
export const transactionItems = pgTable("transaction_items", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transfers
export const transfers = pgTable("transfers", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  amount: numeric("amount").notNull(),
  description: text("description"),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Referrals
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredId: integer("referred_id").notNull().references(() => users.id),
  bonus: numeric("bonus").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// QR Codes
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  code: text("code").notNull().unique(),
  amount: numeric("amount").notNull(),
  description: text("description"),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// System settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, lastLogin: true });

export const insertMerchantSchema = createInsertSchema(merchants)
  .omit({ id: true, createdAt: true });

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({ id: true, createdAt: true });

export const insertTransferSchema = createInsertSchema(transfers)
  .omit({ id: true, createdAt: true });

export const insertProductSchema = createInsertSchema(products)
  .omit({ id: true, createdAt: true });

export const insertQRCodeSchema = createInsertSchema(qrCodes)
  .omit({ id: true, createdAt: true, used: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Merchant = typeof merchants.$inferSelect;
export type InsertMerchant = z.infer<typeof insertMerchantSchema>;

export type Cashback = typeof cashbacks.$inferSelect;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type TransactionItem = typeof transactionItems.$inferSelect;

export type Transfer = typeof transfers.$inferSelect;
export type InsertTransfer = z.infer<typeof insertTransferSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type QRCode = typeof qrCodes.$inferSelect;
export type InsertQRCode = z.infer<typeof insertQRCodeSchema>;

export type Setting = typeof settings.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
