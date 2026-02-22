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
  
  res.cookie("sb-access-token", session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS,
    path: "/",
  });

  res.cookie("sb-refresh-token", session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
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

// import { Request, Response, NextFunction } from "express";
// import { sessionModel } from "../models/sessionModel";
// import { userModel } from "../models/userModel";

// /**
//  * Middleware to protect routes using session-based authentication.
//  * Checks cookie "session_id", validates expiration, and attaches user info to req.user.
//  */
// export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
//   try {
//     const sessionId = req.cookies?.session_id;

//     if (!sessionId) {
//       return res.status(401).json({ error: "Unauthorized: no session cookie found." });
//     }

//     const session = await sessionModel.getSessionById(sessionId);

//     if (!session || sessionModel.isExpired(session)) {
//       // await sessionModel.deleteSession(sessionId);

//       res.clearCookie("session_id", { path: "/" });
//       return res.status(401).json({ error: "Unauthorized: session expired." });
//     }

//     const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
//     await sessionModel.updateSessionExpiration(session.id, newExpiresAt);

//     // refresh the cookie maxAge too
//     res.cookie("session_id", session.id, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "lax",
//       maxAge: SESSION_DURATION_MS,
//       path: "/",
//     });

//     // Fetch user profile
//     const user = await userModel.getUserById(session.user_id);
//     if (!user) {
//       res.clearCookie("session_id", { path: "/" });
//       return res.status(401).json({ error: "Unauthorized: user not found." });
//     }

//     // Attach user info to request object
//     (req as any).user = user;

//     next(); // continue to the protected route
//   } catch (err: any) {
//     console.error("Auth Middleware Error:", err);
//     return res.status(500).json({ error: "Internal server error." });
//   }
// };

// import { Request, Response, NextFunction } from "express";
// import { supabase } from "../config/superbaseAdmin";

// export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const token = req.cookies.access_token;
    
//     if (!token) {
//       return res.status(401).json({ 
//         success: false,
//         message: "No authentication cookie found",
//         code: "NO_AUTH_COOKIE",
//         action: "Please sign in again"
//       });
//     }

//     // Verify token with Supabase
//     const { data, error } = await supabase.auth.getUser(token);
    
//     if (error) {
//       console.error("Token verification failed:", error.message);
      
//       // Clear invalid/expired cookie
//       res.clearCookie('access_token');
//       res.clearCookie('refresh_token');
      
//       // Provide specific error messages
//       if (error.message?.includes("jwt expired")) {
//         return res.status(401).json({ 
//           success: false,
//           message: "Session expired",
//           code: "SESSION_EXPIRED",
//           action: "Please sign in again"
//         });
//       }
      
//       return res.status(401).json({ 
//         success: false,
//         message: "Invalid session",
//         code: "INVALID_SESSION"
//       });
//     }

//     if (!data.user) {
//       // Clear cookie since no user found
//       res.clearCookie('access_token');
//       return res.status(401).json({ 
//         success: false,
//         message: "User not found",
//         code: "USER_NOT_FOUND"
//       });
//     }

//     // Attach user info to req
//     (req as any).user = { 
//       id: data.user.id, 
//       email: data.user.email, 
//       role: data.user.user_metadata?.role || 'customer',
//       isEmailConfirmed: !!data.user.email_confirmed_at
//     };

//     next(); // continue to the route
//   } catch (err: any) {
//     console.error("Auth middleware error:", err);
//     res.status(500).json({ 
//       success: false,
//       message: "Authentication system error",
//       code: "AUTH_SYSTEM_ERROR",
//       ...(process.env.NODE_ENV === 'development' && { error: err.message })
//     });
//   }
// };

// import { Request, Response, NextFunction } from "express";
// import { supabase } from "../config/superbaseAdmin";

// export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   try{
//     // Expect header: Authorization: Bearer <token>
//     const authHeader = req.headers.authorization;
//     if (!authHeader) return res.status(401).json({ message: "No token provided" });

//     const token = authHeader.split(" ")[1]; // Bearer <token>
//     if (!token) return res.status(401).json({ message: "Invalid token" });

//     // Verify token with Supabase
//     const { data, error } = await supabase.auth.getUser(token);
//     if (error || !data.user) return res.status(401).json({ message: "Unauthorized" });

//     // Attach user info to req
//     (req as any).user = { id: data.user.id, email: data.user.email, role: data.user.user_metadata.role };

//     next(); // continue to the route
//   }catch(err: any){
//     res.status(500).json({ message: err.message || "Authentication failed" });
//   }
// };
