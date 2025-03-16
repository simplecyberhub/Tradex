import {
  insertCopyTradeSchema,
  insertInvestmentSchema,
  insertTradeSchema,
  insertTransactionSchema,
} from "@shared/schema";
import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { setupAuth } from "./auth";
import { isAdmin, logAdminAction } from "./middleware/admin";
import { storage } from "./storage";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerRoutes(app: Express): void {
  setupAuth(app);

  // Serve static files from the React app
  const buildPath = path.join(__dirname, "public");
  app.use(express.static(buildPath));

  // Admin routes
  app.get("/admin", isAdmin, (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/admin/users/:id/verify", 
    isAdmin, 
    logAdminAction("verify_user"),
    async (req, res) => {
      await storage.verifyUser(parseInt(req.params.id));
      res.sendStatus(200);
    }
  );

  app.get("/api/admin/transactions/pending", isAdmin, async (req, res) => {
    const transactions = await storage.getPendingTransactions();
    res.json(transactions);
  });

  app.post("/api/admin/transactions/:id/approve",
    isAdmin,
    logAdminAction("approve_transaction"),
    async (req, res) => {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);

      if (!transaction) {
        return res.status(404).send("Transaction not found");
      }

      await storage.updateTransactionStatus(transactionId, "completed");
      await storage.updateTransactionApproval(transactionId, req.user!.id);

      // Update user balance
      const user = await storage.getUser(transaction.userId);
      if (!user) {
        return res.status(404).send("User not found");
      }

      const newBalance = transaction.type === "deposit"
        ? (Number(user.balance) + Number(transaction.amount)).toString()
        : (Number(user.balance) - Number(transaction.amount)).toString();

      await storage.updateUserBalance(user.id, newBalance);

      res.json(transaction);
    }
  );

  // Add transaction routes
  app.post("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.isVerified) return res.status(403).send("Account must be verified first");

    const validation = insertTransactionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error);
    }

    const transaction = await storage.createTransaction({
      ...validation.data,
      userId: req.user.id,
      status: "pending", // All transactions now start as pending
      timestamp: new Date(),
      approvedBy: null,
      approvedAt: null,
    });

    res.status(201).json(transaction);
  });

  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transactions = await storage.getUserTransactions(req.user.id);
    res.json(transactions);
  });

  // Trading routes
  app.post("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const validation = insertTradeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error);
    }

    const trade = await storage.createTrade({
      ...validation.data,
      userId: req.user.id,
      timestamp: new Date(),
    });

    // Update user balance
    const tradeAmount = Number(validation.data.amount) * Number(validation.data.price);
    const newBalance = Number(req.user.balance) - tradeAmount;
    await storage.updateUserBalance(req.user.id, newBalance.toString());

    res.status(201).json(trade);
  });

  app.get("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const trades = await storage.getUserTrades(req.user.id);
    res.json(trades);
  });

  // Investment routes
  app.post("/api/investments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const validation = insertInvestmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error);
    }

    const investment = await storage.createInvestment({
      ...validation.data,
      userId: req.user.id,
      startDate: new Date(),
      endDate: validation.data.endDate,
    });

    // Update user balance
    const newBalance = Number(req.user.balance) - Number(validation.data.amount);
    await storage.updateUserBalance(req.user.id, newBalance.toString());

    res.status(201).json(investment);
  });

  app.get("/api/investments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const investments = await storage.getUserInvestments(req.user.id);
    res.json(investments);
  });

  // Copy trading routes
  app.post("/api/copy-trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const validation = insertCopyTradeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error);
    }

    const copyTrade = await storage.createCopyTrade({
      ...validation.data,
      followerId: req.user.id,
      active: true,
    });

    res.status(201).json(copyTrade);
  });

  app.get("/api/copy-trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const copyTrades = await storage.getActiveCopyTrades(req.user.id);
    res.json(copyTrades);
  });

  app.post("/api/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.verifyUser(req.user.id);
    res.sendStatus(200);
  });

  // Serve the React app for any other routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });

  const httpServer = createServer(app);
  return httpServer;
}