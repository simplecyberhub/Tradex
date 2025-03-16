// filepath: /c:/laragon/www/tradesphere/server/routes/adminRoutes.ts
import { Router } from "express";
import { isAdmin, logAdminAction } from "../middleware/admin";
import { storage } from "../storage";

const router = Router();

// Admin dashboard route
router.get("/dashboard", isAdmin, (req, res) => {
  res.json({ message: "Welcome to the Admin Dashboard" });
});

// Example route to manage users
router.get("/users", isAdmin, async (req, res) => {
  const users = await storage.getAllUsers();
  res.json(users);
});

// Example route to log admin actions
router.post("/log-action", isAdmin, logAdminAction("Admin Action"), (req, res) => {
  res.json({ message: "Action logged" });
});

export default router;