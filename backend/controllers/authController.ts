import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { supabaseClient } from "../config/supabaseClient";
import { userModel } from "../models/userModel";
import { clearAuthCookies } from "../middleware/authMiddleware";

export const authController = {
  signUp: async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, isPartner } = req.body;

    if(!email || !password || !firstName || !lastName){
      return res.status(400).json({ message: "All fields are required." });
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }
    // Validate password strength
    if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUser?.users?.some(u => u.email === email);
      if (userExists) {
          return res.status(409).json({ message: "User with this email already exists." });
      }

      // Test 1: List all users (admin only)
      // const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      // console.log("Admin users test:", { users: users?.users?.length, usersError });

      // /*
      console.log("Creating user in Auth...");
      // */

      // Create user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        // email_confirm: true, // Skip email confirmation for testing
        user_metadata: { firstName, lastName, role: isPartner ? "proprietor" : "customer" }
      });
      if (signUpError) return res.status(400).json({ error: signUpError.message });

      console.log("SignUpData:", signUpData);

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("User ID not returned from Supabase");

      return res.status(201).json({
        message: "Signup successful! Please check your email to confirm your account.",
        userId: signUpData.user?.id,
      });
    } catch (err: any) {
      // If user was created in Auth but something else failed, delete the Auth user
      // if (signUpData?.user?.id) {
      //   await supabaseAdmin.auth.admin.deleteUser(signUpData.user.id);
      //   console.log("Rolled back Auth user due to error:", err.message);
      // }
      console.error("SignUp Error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  resendConfirmation: async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if already confirmed
    if (user.confirmed_at) {
      return res.status(400).json({ message: "Email is already confirmed." });
    }

    // check last resend timestamp from your DB
    // const profile = await userModel.getUserById(user.id);
    // const lastSent = profile?.last_confirmation_sent;
    // if (lastSent && Date.now() - lastSent < 45000) { // 45s cooldown
    //   return res.status(429).json({ message: "Please wait before resending email." });
    // }

    try {
      const { error } = await supabaseClient.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${process.env.FRONTEND_URL}/check-email?confirmed=true`
        }
      });

      if (error) {
        return res.status(500).json({ message: error.message });
      }

      // update last resend timestamp in DB
      // await userModel.updateUser(user.id, { last_confirmation_sent: Date.now() });

      return res.status(200).json({ message: "Confirmation email resent successfully." });
    } catch (err: any) {
      console.error("Resend Confirmation Error:", err);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
    
  signIn: async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required." });
    }

    try {
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (signInError) return res.status(401).json({ error: signInError.message });

      if (!signInData.user?.email_confirmed_at) {
        return res.status(403).json({ message: "Please confirm your email before signing in." });
      }

      const userId = signInData.user.id;

      // Set Supabase auth cookies
      res.cookie("sb-access-token", signInData.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.cookie("sb-refresh-token", signInData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      // Return profile info
      const userProfile = await userModel.getUserById(userId);
      if (!userProfile) {
        clearAuthCookies(res);
        return res.status(500).json({ error: "User profile not found." });
      }
      const user = {
        id: userProfile.id,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        role: userProfile.role,
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        avatar_url: userProfile.avatar_url || "",
        email: signInData.user?.email,
      };
      return res.json({ user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  signInWithGoogle: async (req: Request, res: Response) => {
    try {
      // console.log("=== Starting Google OAuth flow ===");
      // console.log("1. Environment check:");
      // console.log("   - API_BASE_URL:", process.env.API_BASE_URL);
      // console.log("   - FRONTEND_URL:", process.env.FRONTEND_URL);
      // console.log("   - NODE_ENV:", process.env.NODE_ENV);
      // const redirectTo = `${process.env.API_BASE_URL}/api/auth/oauth/callback`;
      // console.log("2. Redirect URL being sent to Supabase:", redirectTo);

      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.API_BASE_URL}/api/auth/oauth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      // console.log("3. OAuth URL generated successfully");
      // console.log("4. URL preview:", data.url.substring(0, 100) + "...");
      // console.log("=== End Google OAuth flow ===\n");

      return res.json({ url: data.url });

    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },

  oauthCallback: async (req: Request, res: Response) => {
    // console.log("\n=== OAuth Callback Received ===");
    // console.log("1. Timestamp:", new Date().toISOString());
    // console.log("2. Full URL:", req.protocol + '://' + req.get('host') + req.originalUrl);
    // console.log("3. Query parameters:", req.query);
    // console.log("4. Headers:", {
    //   host: req.get('host'),
    //   referer: req.get('referer'),
    //   'user-agent': req.get('user-agent')
    // });
    
    try {
      const { code } = req.query;
      
      if (!code) {
        // console.error("5. ERROR: No code parameter received");
        // console.log("=== End Callback (Error) ===\n");
        return res.status(400).send("Missing OAuth code");
      }

      // console.log("5. Code received successfully");
      // console.log("6. Code preview:", code.toString().substring(0, 20) + "...");
      // console.log("7. Exchanging code for session...");

      const { data, error } = await supabaseClient.auth.exchangeCodeForSession(
        code as string
      );

      if (error) {
        // console.error("8. Exchange error:", error);
        // console.log("=== End Callback (Error) ===\n");
        return res.status(400).send("OAuth failed: " + error.message);
      }

      if (!data.session) {
        // console.error("8. ERROR: No session returned");
        // console.log("=== End Callback (Error) ===\n");
        return res.status(400).send("No session created");
      }

      // console.log("8. Session created successfully");
      // console.log("9. User:", {
      //   id: data.session.user.id,
      //   email: data.session.user.email,
      //   name: data.session.user.user_metadata?.full_name
      // });

      // Set cookies
      // console.log("10. Setting cookies...");
      res.cookie("sb-access-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      res.cookie("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });

      // Set user info
      if (data.session.user) {
        res.cookie("sb-user", JSON.stringify({
          id: data.session.user.id,
          email: data.session.user.email,
          name: data.session.user.user_metadata?.full_name || data.session.user.email,
          avatar: data.session.user.user_metadata?.avatar_url,
        }), {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: "/",
        });
      }

      // console.log("11. Redirecting to frontend:", process.env.FRONTEND_URL || "http://localhost:8080");
      // console.log("=== End Callback (Success) ===\n");
      
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:8080"}/`);

    } catch (err: any) {
      // console.error("=== OAuth Callback Error ===");
      // console.error(err);
      // console.log("=== End Callback (Exception) ===\n");
      return res.status(500).send(err.message);
    }
  },

  getProfile: async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    // console.log("[BACKEND] Fetching profile for userId:", userId);
    try{
      const userProfile = await userModel.getUserById(user.id);
      
      // /*
      console.log("[BACKEND] Fetched user profile:", userProfile?.id);
      // */

      if (!userProfile) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(200).json({ 
        user: {
          id: userProfile.id,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          role: userProfile.role,
          phone: userProfile.phone || "",
          address: userProfile.address || "",
          avatar_url: userProfile.avatar_url || "",
          email: user.email, // Get email from token
        }
      });
    }catch(err: any){
      console.error("[BACKEND] Error in getUserById:", err.message); 
      res.status(500).json({ error: err.message });
    }
  },

  signOut: async (req: Request, res: Response) => {
    try {
      // const sessionId = req.cookies?.session_id;

      // if (sessionId) {
      //   // await SessionModel.deleteSession(sessionId);
        
      //   // Clear the cookie
      //   res.clearCookie("session_id", { path: "/" });
      // }
      // const accessToken = req.cookies?.["sb-access-token"];
      
      // if (accessToken) {
        // Sign out from Supabase
        // const { error } = await supabaseClient.auth.signOut(accessToken);
        // if (error) {
        //   console.error("Supabase signOut error:", error);
        // }
      // }
      
      // Clear cookies
      clearAuthCookies(res);

      return res.json({ message: "Successfully logged out." });
    } catch (err: any) {
      console.error("Logout Error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
};