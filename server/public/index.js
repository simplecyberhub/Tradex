var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express3 from "express";

// server/auth.ts
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import session2 from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { promisify } from "util";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminLogs: () => adminLogs,
  copyTrades: () => copyTrades,
  insertAdminLogSchema: () => insertAdminLogSchema,
  insertCopyTradeSchema: () => insertCopyTradeSchema,
  insertInvestmentSchema: () => insertInvestmentSchema,
  insertTradeSchema: () => insertTradeSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserSchema: () => insertUserSchema,
  investments: () => investments,
  trades: () => trades,
  transactions: () => transactions,
  users: () => users
});
import { boolean, decimal, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("10000").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  role: text("role").default("user").notNull()
  // 'admin' or 'user'
});
var transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  // 'deposit' or 'withdrawal'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(),
  // 'pending', 'completed', 'failed'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at")
});
var trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(),
  // buy or sell
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
var investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planName: text("plan_name").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull()
});
var copyTrades = pgTable("copy_trades", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  traderId: integer("trader_id").notNull(),
  active: boolean("active").default(true).notNull()
});
var adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertTransactionSchema = createInsertSchema(transactions).extend({
  amount: z.string().or(z.number()).transform((val) => val.toString())
}).omit({
  id: true,
  userId: true,
  timestamp: true,
  status: true,
  approvedBy: true,
  approvedAt: true
});
var insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  userId: true,
  timestamp: true
});
var insertInvestmentSchema = createInsertSchema(investments).extend({
  amount: z.string().or(z.number()).transform((val) => val.toString()),
  endDate: z.date().or(z.string().transform((val) => new Date(val)))
}).omit({
  id: true,
  userId: true,
  startDate: true
});
var insertCopyTradeSchema = createInsertSchema(copyTrades).omit({
  id: true,
  followerId: true
});
var insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  timestamp: true
});

// server/storage.ts
import connectPg from "connect-pg-simple";
import { and, eq } from "drizzle-orm";
import session from "express-session";
import pg2 from "pg";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to configure your database?");
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
  // Disable SSL for local PostgreSQL
});
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
var { Pool: Pool2 } = pg2;
var PostgresSessionStore = connectPg(session);
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: "session",
      schemaName: "public",
      pruneSessionInterval: false
      // Add conflict handling if needed
      // onConflict: 'sid' // Example: specify the column for conflict handling
    });
  }
  async getAllUsers() {
    return db.select().from(users);
  }
  async getPendingTransactions() {
    return db.select().from(transactions).where(eq(transactions.status, "pending || approved || declined"));
  }
  async getTransaction(id) {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }
  async updateTransactionApproval(id, adminId) {
    await db.update(transactions).set({
      approvedBy: adminId,
      approvedAt: /* @__PURE__ */ new Date()
    }).where(eq(transactions.id, id));
  }
  async createAdminLog(log2) {
    const [adminLog] = await db.insert(adminLogs).values({
      ...log2,
      timestamp: /* @__PURE__ */ new Date()
    }).returning();
    return adminLog;
  }
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUserBalance(userId, newBalance) {
    await db.update(users).set({ balance: newBalance }).where(eq(users.id, userId));
  }
  async verifyUser(userId) {
    await db.update(users).set({ isVerified: true }).where(eq(users.id, userId));
  }
  async createTransaction(transaction) {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }
  async getUserTransactions(userId) {
    return db.select().from(transactions).where(eq(transactions.userId, userId));
  }
  async updateTransactionStatus(id, status) {
    await db.update(transactions).set({ status }).where(eq(transactions.id, id));
  }
  async createTrade(trade) {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }
  async getUserTrades(userId) {
    return db.select().from(trades).where(eq(trades.userId, userId));
  }
  async createInvestment(investment) {
    const [newInvestment] = await db.insert(investments).values(investment).returning();
    return newInvestment;
  }
  async getUserInvestments(userId) {
    return db.select().from(investments).where(eq(investments.userId, userId));
  }
  async createCopyTrade(copyTrade) {
    const [newCopyTrade] = await db.insert(copyTrades).values(copyTrade).returning();
    return newCopyTrade;
  }
  async getActiveCopyTrades(userId) {
    return db.select().from(copyTrades).where(and(eq(copyTrades.followerId, userId), eq(copyTrades.active, true)));
  }
  async deactivateCopyTrade(id) {
    await db.update(copyTrades).set({ active: false }).where(eq(copyTrades.id, id));
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  if (!stored) return false;
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
function setupAuth(app2) {
  const sessionSettings = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore
  };
  if (app2.get("env") === "production") {
    app2.set("trust proxy", 1);
  }
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }
    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password)
    });
    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (err2) => {
        if (err2) return next(err2);
        res.status(200).json(user);
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}

// server/routes.ts
import express from "express";
import { createServer } from "http";
import path from "path";

// server/middleware/admin.ts
function isAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  next();
}
function logAdminAction(action) {
  return async (req, res, next) => {
    const originalJson = res.json;
    res.json = function(body) {
      const adminLog = {
        adminId: req.user.id,
        action,
        details: JSON.stringify(body)
      };
      storage.createAdminLog(adminLog);
      return originalJson.call(this, body);
    };
    next();
  };
}

// server/routes.ts
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function registerRoutes(app2) {
  setupAuth(app2);
  const buildPath = path.join(__dirname, "public");
  app2.use(express.static(buildPath));
  app2.get("/admin", isAdmin, (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
  app2.get("/api/admin/users", isAdmin, async (req, res) => {
    const users2 = await storage.getAllUsers();
    res.json(users2);
  });
  app2.post(
    "/api/admin/users/:id/verify",
    isAdmin,
    logAdminAction("verify_user"),
    async (req, res) => {
      await storage.verifyUser(parseInt(req.params.id));
      res.sendStatus(200);
    }
  );
  app2.get("/api/admin/transactions/pending", isAdmin, async (req, res) => {
    const transactions2 = await storage.getPendingTransactions();
    res.json(transactions2);
  });
  app2.post(
    "/api/admin/transactions/:id/approve",
    isAdmin,
    logAdminAction("approve_transaction"),
    async (req, res) => {
      const transactionId = parseInt(req.params.id);
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).send("Transaction not found");
      }
      await storage.updateTransactionStatus(transactionId, "completed");
      await storage.updateTransactionApproval(transactionId, req.user.id);
      const user = await storage.getUser(transaction.userId);
      if (!user) {
        return res.status(404).send("User not found");
      }
      const newBalance = transaction.type === "deposit" ? (Number(user.balance) + Number(transaction.amount)).toString() : (Number(user.balance) - Number(transaction.amount)).toString();
      await storage.updateUserBalance(user.id, newBalance);
      res.json(transaction);
    }
  );
  app2.post("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.isVerified) return res.status(403).send("Account must be verified first");
    const validation = insertTransactionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error);
    }
    const transaction = await storage.createTransaction({
      ...validation.data,
      userId: req.user.id,
      status: "pending",
      // All transactions now start as pending
      timestamp: /* @__PURE__ */ new Date(),
      approvedBy: null,
      approvedAt: null
    });
    res.status(201).json(transaction);
  });
  app2.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transactions2 = await storage.getUserTransactions(req.user.id);
    res.json(transactions2);
  });
  app2.post("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertTradeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error);
    }
    const trade = await storage.createTrade({
      ...validation.data,
      userId: req.user.id,
      timestamp: /* @__PURE__ */ new Date()
    });
    const tradeAmount = Number(validation.data.amount) * Number(validation.data.price);
    const newBalance = Number(req.user.balance) - tradeAmount;
    await storage.updateUserBalance(req.user.id, newBalance.toString());
    res.status(201).json(trade);
  });
  app2.get("/api/trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const trades2 = await storage.getUserTrades(req.user.id);
    res.json(trades2);
  });
  app2.post("/api/investments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertInvestmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error);
    }
    const investment = await storage.createInvestment({
      ...validation.data,
      userId: req.user.id,
      startDate: /* @__PURE__ */ new Date(),
      endDate: validation.data.endDate
    });
    const newBalance = Number(req.user.balance) - Number(validation.data.amount);
    await storage.updateUserBalance(req.user.id, newBalance.toString());
    res.status(201).json(investment);
  });
  app2.get("/api/investments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const investments2 = await storage.getUserInvestments(req.user.id);
    res.json(investments2);
  });
  app2.post("/api/copy-trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const validation = insertCopyTradeSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error);
    }
    const copyTrade = await storage.createCopyTrade({
      ...validation.data,
      followerId: req.user.id,
      active: true
    });
    res.status(201).json(copyTrade);
  });
  app2.get("/api/copy-trades", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const copyTrades2 = await storage.getActiveCopyTrades(req.user.id);
    res.json(copyTrades2);
  });
  app2.post("/api/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    await storage.verifyUser(req.user.id);
    res.sendStatus(200);
  });
  app2.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/routes/adminRoutes.ts
import { Router } from "express";
var router = Router();
router.get("/dashboard", isAdmin, (req, res) => {
  res.json({ message: "Welcome to the Admin Dashboard" });
});
router.get("/users", isAdmin, async (req, res) => {
  const users2 = await storage.getAllUsers();
  res.json(users2);
});
router.post("/log-action", isAdmin, logAdminAction("Admin Action"), (req, res) => {
  res.json({ message: "Action logged" });
});
var adminRoutes_default = router;

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path3, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import react from "@vitejs/plugin-react";
import path2, { dirname } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { defineConfig } from "vite";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname(__filename2);
var vite_config_default = defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname2, "client", "src"),
      "@shared": path2.resolve(__dirname2, "shared")
    }
  },
  root: path2.resolve(__dirname2, "client"),
  build: {
    outDir: path2.resolve(__dirname2, "server/public"),
    emptyOutDir: true,
    rollupOptions: {
      external: ["next/link"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = dirname2(__filename3);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname3,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname3, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { createServer as createServer2 } from "http";
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
setupAuth(app);
app.use("/api/admin", adminRoutes_default);
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = createServer2(app);
  registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = 5e3;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
