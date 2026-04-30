import { Request, Response, NextFunction } from "express";
import { supabaseClient } from "../config/supabaseClient";
import { userModel } from "../models/userModel";
import { logger } from "../utils/logger";

const isProd = process.env.NODE_ENV === "production";
const sameSitePolicy: "lax" | "none" = isProd ? "none" : "lax";

/**
 * Middleware to protect routes using Supabase Auth.
 * Checks for Supabase auth tokens and attaches user info to req.user.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get tokens from cookies (or Authorization header as fallback)
    const accessToken = req.cookies?.["sb-access-token"] || 
                       req.headers.authorization?.replace("Bearer ", "");
    const refreshToken = req.cookies?.["sb-refresh-token"];

    if (!accessToken) {
      logger.warn("auth failed", { reason: "missing_access_token", path: req.path });
      return res.status(401).json({ error: "Unauthorized." });
    }

    // Verify the access token and get user
    const { data: { user }, error: getUserError } = await supabaseClient.auth.getUser(accessToken);
    
    // If access token is invalid or expired, try to refresh it
    if (getUserError || !user) {
      if (!refreshToken) {
        clearAuthCookies(res);
        logger.warn("auth failed", { reason: "missing_refresh_token", path: req.path });
        return res.status(401).json({ error: "Unauthorized." });
      }

      // Attempt to refresh the session
      const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (refreshError || !refreshData.session) {
        clearAuthCookies(res);
        logger.warn("auth failed", { reason: "session_refresh_failed", path: req.path });
        return res.status(401).json({ error: "Unauthorized." });
      }

      // Set new cookies with refreshed tokens
      setAuthCookies(res, refreshData.session);
      
      // Use the new user from refreshed session
      const refreshedUser = refreshData.user;
      if (!refreshedUser) {
        clearAuthCookies(res);
        logger.warn("auth failed", { reason: "missing_refreshed_user", path: req.path });
        return res.status(401).json({ error: "Unauthorized." });
      }

      // Fetch user profile
      const userProfile = await userModel.getUserById(refreshedUser.id);
      if (!userProfile) {
        clearAuthCookies(res);
        logger.warn("auth failed", { reason: "missing_user_profile_after_refresh", path: req.path });
        return res.status(401).json({ error: "Unauthorized." });
      }

      // Attach user info to request object
      (req as any).user = {
        ...userProfile,
        email: refreshedUser.email,
        email_confirmed_at: refreshedUser.email_confirmed_at,
      };

      return next();
    }

    // Access token is valid - fetch user profile
    const userProfile = await userModel.getUserById(user.id);
    if (!userProfile) {
      clearAuthCookies(res);
      logger.warn("auth failed", { reason: "missing_user_profile", path: req.path });
      return res.status(401).json({ error: "Unauthorized." });
    }

    // Attach user info to request object
    (req as any).user = {
      ...userProfile,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
    };

    next(); // continue to the protected route
  } catch (err: any) {
    console.error("Auth Middleware Error:", err);
    clearAuthCookies(res);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Helper function to set Supabase auth cookies
 */
export const setAuthCookies = (res: Response, session: any) => {
  const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  res.cookie("sb-access-token", session.access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSitePolicy,
    maxAge: SESSION_DURATION_MS,
    path: "/",
  });

  res.cookie("sb-refresh-token", session.refresh_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: sameSitePolicy,
    maxAge: SESSION_DURATION_MS,
    path: "/",
  });
};

/**
 * Helper function to clear auth cookies
 */
export const clearAuthCookies = (res: Response) => {
  res.clearCookie("sb-access-token", { path: "/" });
  res.clearCookie("sb-refresh-token", { path: "/" });
};

//Middleware to restrict a route to admin (proprietor) users only.
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || !["proprietor", "admin", "super_admin"].includes(user.role)) {
    return res.status(403).json({ error: "Forbidden: admin access required." });
  }
  next();
};

/**
 * Middleware to restrict a route to super_admin users only.
 * Must be used AFTER authMiddleware.
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== "super_admin") {
    return res.status(403).json({ error: "Forbidden: super admin access required." });
  }
  next();
};

/**
 * Optional: Type declaration for request with user
 */
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: string;
//         email: string;
//         first_name: string;
//         last_name: string;
//         role: string;
//         phone?: string;
//         address?: string;
//         avatar_url?: string;
//       };
//     }
//   }
// }