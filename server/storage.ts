import { AdminLog, adminLogs, CopyTrade, copyTrades, InsertUser, Investment, investments, Trade, trades, Transaction, transactions, User, users, } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { and, eq } from "drizzle-orm";
import session from "express-session";
import pg from 'pg';
import { db, pool } from "./db";
const { Pool } = pg;


const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, newBalance: string): Promise<void>;
  verifyUser(userId: number): Promise<void>;
  getAllUsers(): Promise<User[]>;

  // Transaction operations
  createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string): Promise<void>;
  getPendingTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  updateTransactionApproval(id: number, adminId: number): Promise<void>;

  // Admin operations
  createAdminLog(log: Omit<AdminLog, "id" | "timestamp">): Promise<AdminLog>;

  // Trade operations
  createTrade(trade: Omit<Trade, "id">): Promise<Trade>;
  getUserTrades(userId: number): Promise<Trade[]>;

  // Investment operations
  createInvestment(investment: Omit<Investment, "id">): Promise<Investment>;
  getUserInvestments(userId: number): Promise<Investment[]>;

  // Copy trading operations
  createCopyTrade(copyTrade: Omit<CopyTrade, "id">): Promise<CopyTrade>;
  getActiveCopyTrades(userId: number): Promise<CopyTrade[]>;
  deactivateCopyTrade(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  readonly sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session',
      schemaName: 'public',
      pruneSessionInterval: false,
      // Add conflict handling if needed
      // onConflict: 'sid' // Example: specify the column for conflict handling
    });
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return db.select()
      .from(transactions)
      .where(eq(transactions.status, "pending || approved || declined"));
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }

  async updateTransactionApproval(id: number, adminId: number): Promise<void> {
    await db.update(transactions)
      .set({
        approvedBy: adminId,
        approvedAt: new Date(),
      })
      .where(eq(transactions.id, id));
  }

  async createAdminLog(log: Omit<AdminLog, "id" | "timestamp">): Promise<AdminLog> {
    const [adminLog] = await db.insert(adminLogs)
      .values({
        ...log,
        timestamp: new Date(),
      })
      .returning();
    return adminLog;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users)
      .values(insertUser) // Ensure insertUser doesn't contain 'id'
      .returning();
    return user;
  }  
  

  async updateUserBalance(userId: number, newBalance: string): Promise<void> {
    await db.update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, userId));
  }

  async verifyUser(userId: number): Promise<void> {
    await db.update(users)
      .set({ isVerified: true })
      .where(eq(users.id, userId));
  }

  async createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async updateTransactionStatus(id: number, status: string): Promise<void> {
    await db.update(transactions)
      .set({ status })
      .where(eq(transactions.id, id));
  }

  async createTrade(trade: Omit<Trade, "id">): Promise<Trade> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async getUserTrades(userId: number): Promise<Trade[]> {
    return db.select().from(trades).where(eq(trades.userId, userId));
  }

  async createInvestment(investment: Omit<Investment, "id">): Promise<Investment> {
    const [newInvestment] = await db.insert(investments).values(investment).returning();
    return newInvestment;
  }

  async getUserInvestments(userId: number): Promise<Investment[]> {
    return db.select().from(investments).where(eq(investments.userId, userId));
  }

  async createCopyTrade(copyTrade: Omit<CopyTrade, "id">): Promise<CopyTrade> {
    const [newCopyTrade] = await db.insert(copyTrades).values(copyTrade).returning();
    return newCopyTrade;
  }

  async getActiveCopyTrades(userId: number): Promise<CopyTrade[]> {
    return db.select()
      .from(copyTrades)
      .where(and(eq(copyTrades.followerId, userId), eq(copyTrades.active, true)));
  }

  async deactivateCopyTrade(id: number): Promise<void> {
    await db.update(copyTrades)
      .set({ active: false })
      .where(eq(copyTrades.id, id));
  }
}

export const storage = new DatabaseStorage();