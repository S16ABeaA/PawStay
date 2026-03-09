import { Request, Response, NextFunction } from "express";
import { supabaseClient } from "../config/supabaseClient";
import { userModel } from "../models/userModel";

/**
 * Middleware to protect routes using Supabase Auth.
 * Checks for Supabase auth tokens and attaches user info to req.user.
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  console.log("========== AUTH MIDDLEWARE START ==========");
  console.log("Path:", req.path);
  console.log("Cookies:", req.cookies);
  
  try {
    // Get tokens from cookies (or Authorization header as fallback)
    const accessToken = req.cookies?.["sb-access-token"] || 
                       req.headers.authorization?.replace("Bearer ", "");
    const refreshToken = req.cookies?.["sb-refresh-token"];

    if (!accessToken) {
      return res.status(401).json({ error: "Unauthorized: no access token found." });
    }

    console.log("Access token exists:", !!accessToken);
    console.log("Access token first 30 chars:", accessToken?.substring(0, 30) + "...");

    // Verify the access token and get user
    const { data: { user }, error: getUserError } = await supabaseClient.auth.getUser(accessToken);
    
    // If access token is invalid or expired, try to refresh it
    if (getUserError || !user) {
      if (!refreshToken) {
        clearAuthCookies(res);
        return res.status(401).json({ error: "Unauthorized: session expired. Please login again." });
      }

      // Attempt to refresh the session
      const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (refreshError || !refreshData.session) {
        clearAuthCookies(res);
        return res.status(401).json({ error: "Unauthorized: session refresh failed." });
      }

      // Set new cookies with refreshed tokens
      setAuthCookies(res, refreshData.session);
      
      // Use the new user from refreshed session
      const refreshedUser = refreshData.user;
      if (!refreshedUser) {
        clearAuthCookies(res);
        return res.status(401).json({ error: "Unauthorized: user not found after refresh." });
      }

      // Fetch user profile
      const userProfile = await userModel.getUserById(refreshedUser.id);
      if (!userProfile) {
        clearAuthCookies(res);
        return res.status(401).json({ error: "Unauthorized: user profile not found." });
      }

      // Attach user info to request object
      (req as any).user = {
        ...userProfile,
        email: refreshedUser.email,
      };

      return next();
    }

    // Access token is valid - fetch user profile
    const userProfile = await userModel.getUserById(user.id);
    if (!userProfile) {
      clearAuthCookies(res);
      return res.status(401).json({ error: "Unauthorized: user profile not found." });
    }

    // Attach user info to request object
    (req as any).user = {
      ...userProfile,
      email: user.email,
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

  const isProd = process.env.NODE_ENV === 'production';
  const cookieSameSite: 'none' | 'lax' = isProd ? 'none' : 'lax';
  const cookieSecure = isProd;

  const cookieOpts = {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
    maxAge: SESSION_DURATION_MS,
    path: "/",
  } as any;

  res.cookie("sb-access-token", session.access_token, cookieOpts);
  res.cookie("sb-refresh-token", session.refresh_token, cookieOpts);
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
  if (!user || (user.role !== "proprietor")) {
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
