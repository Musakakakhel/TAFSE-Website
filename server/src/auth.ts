import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
    displayName?: string;
  }
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) return next();
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.redirect("/admin/login");
}
