import { boolean, decimal, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("10000").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  role: text("role").default("user").notNull(), // 'admin' or 'user'
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'deposit' or 'withdrawal'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // 'pending', 'completed', 'failed'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // buy or sell
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planName: text("plan_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
});

export const copyTrades = pgTable("copy_trades", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  traderId: integer("trader_id").notNull(),
  active: boolean("active").default(true).notNull(),
});

export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).extend({
  amount: z.string().or(z.number()).transform(val => val.toString()),
}).omit({
  id: true,
  userId: true,
  timestamp: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  userId: true,
  timestamp: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).extend({
  amount: z.string().or(z.number()).transform(val => val.toString()),
  endDate: z.date().or(z.string().transform(val => new Date(val))),
}).omit({
  id: true,
  userId: true,
  startDate: true,
});

export const insertCopyTradeSchema = createInsertSchema(copyTrades).omit({
  id: true,
  followerId: true,
});

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type CopyTrade = typeof copyTrades.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;