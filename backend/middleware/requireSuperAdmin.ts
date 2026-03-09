import { Request, Response, NextFunction } from "express";

/**
 * Middleware that restricts access to super_admin role only.
 * Must be used AFTER authMiddleware (which sets req.user).
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userRole = (req as any).user?.role;
  if (userRole !== "super_admin") {
    return res.status(403).json({ error: "Access denied. Super admin only." });
  }
  next();
};
