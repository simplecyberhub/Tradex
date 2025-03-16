import { NextFunction, Request, Response } from "express";
import { storage } from "server/storage";

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  next();
}

export function logAdminAction(action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function (body) {
      const adminLog = {
        adminId: req.user!.id,
        action,
        details: JSON.stringify(body),
      };
      storage.createAdminLog(adminLog);
      return originalJson.call(this, body);
    };
    next();
  };
}
