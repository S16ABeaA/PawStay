import { Request, Response } from "express";
import { supabase } from "../config/supabaseAdmin";
import { supabaseClient } from "../config/supabaseClient";
import { userModel } from "../models/userModel";
import { clearAuthCookies } from "../middleware/authMiddleware";

export const authController = {
  signUp: async (req: Request, res: Response) => {
    console.log("signUp controller hit");

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
      // const { data: existingUser } = await supabase.auth.admin.listUsers();
      // const userExists = existingUser?.users?.some(u => u.email === email);
      // if (userExists) {
      //     return res.status(409).json({ message: "User with this email already exists." });
      // }

      // Test 1: List all users (admin only)
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      console.log("Admin users test:", { users: users?.users?.length, usersError });

      // Create user in Supabase Auth
      
      console.log("Creating user in Auth...");

      const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email confirmation for testing
        user_metadata: { firstName, lastName, role: isPartner ? "proprietor" : "customer" }
      });
      if (signUpError) return res.status(400).json({ error: signUpError.message });

      console.log("SignUpData:", signUpData);
      console.log("Creating user profile...");

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("User ID not returned from Supabase");
      console.log("userId:", userId);
      console.log("firstname:", firstName);
      console.log("lastname:", lastName);
      console.log("isPartner:", isPartner);
      // Create user profile in profiles table (db)
      await userModel.createUser({
        id: userId,
        firstName,
        lastName,
        role: isPartner ? "proprietor" : "customer",
      });
// console.log("Waiting for profile commit...");
// await new Promise(resolve => setTimeout(resolve, 1000));
await new Promise(r => setTimeout(r, 300));

console.log("Signing in...");
      //Sign in the user immediately after signup
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,

        password,
      });
      if (signInError) throw signInError;
console.log("SignInData:", signInData);
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
      // Create session for the new user


      // const session = await sessionModel.createSession(userId);

      // Set cookie
      // res.cookie("session_id", session.id, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "lax",
      //   maxAge: SESSION_DURATION_MS,
      //   path: "/",
      // });
      
      // Return user profile
      const userProfile = await userModel.getUserById(userId);
      if (!userProfile) {
        return res.status(404).json({ error: "User not found" });
      }
      const user = {
        id: userProfile.id,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        role: userProfile.role,
        phone: userProfile.phone || "",
        address: userProfile.address || "",
        avatar_url: userProfile.avatar_url || "",
        email: signUpData.user?.email,
      };
      console.log("User profile created:", user);
      return res.status(201).json({ user
        // , session: {
        //   access_token: signInData.session.access_token,
        //   expires_at: signInData.session.expires_at
      //   } 
      });
    } catch (err: any) {
      console.error("SignUp Error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
  
  signIn: async (req: Request, res: Response) => {
    console.log("signIn controller hit");
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required." });
    }

    try {
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (signInError) return res.status(401).json({ error: signInError.message });

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

      // Create session
      // const session = await sessionModel.createSession(userId);

      // // Set cookie
      // res.cookie("session_id", session.id, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "lax",
      //   maxAge: SESSION_DURATION_MS,
      // });

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
      return res.json({ user
        // , session: {
        //   access_token: signInData.session.access_token,
        //   expires_at: signInData.session.expires_at
        // } 
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
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
      console.log("[BACKEND] Fetched user profile:", userProfile?.id);
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
          // role: user.role
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

  // signUp: async (req: Request, res: Response) => {
  //   const { email, password, firstName, lastName, isPartner } = req.body;

  //   if(!email || !password || !firstName || !lastName){
  //     return res.status(400).json({ message: "All fields are required." });
  //   }
  //   // Validate email format
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //   if (!emailRegex.test(email)) {
  //       return res.status(400).json({ message: "Invalid email format." });
  //   }
  //   // Validate password strength
  //   if (password.length < 6) {
  //       return res.status(400).json({ message: "Password must be at least 6 characters." });
  //   }

  //   try{
      
  //     // Check if user already exists
  //     const { data: existingUser } = await supabase.auth.admin.listUsers();
  //     const userExists = existingUser?.users?.some(u => u.email === email);
  //     if (userExists) {
  //         return res.status(409).json({ message: "User with this email already exists." });
  //     }
      
  //     //Create user in Supabase Auth
  //     const { data, error } = await supabase.auth.admin.createUser({
  //       email,
  //       password,
  //       email_confirm: true, // Skip email confirmation for testing
  //       user_metadata: { firstName, lastName, role: isPartner ? "proprietor" : "customer" }
  //     });
  //     if (error) {
  //           console.error("Auth creation error:", error);
  //           throw error;
  //       }
  //     if (error) throw error;

  //     //Insert user in profiles table
  //     const userId = data.user?.id;
  //     if (!userId) throw new Error("User ID not returned from Supabase");

  //     await UserModel.createUser({
  //       id: userId,
  //       firstName,
  //       lastName,
  //       role: isPartner ? "proprietor" : "customer",
  //     });

  //     //Sign in the user immediately after signup
  //     const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  //       email,
  //       password,
  //     });
  //     if (signInError) throw signInError;

  //     // Set cookies
  //     res.cookie('access_token', signInData.session.access_token, {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //       sameSite: 'strict',
  //       maxAge: 15 * 60 * 1000,
  //       path: '/',
  //     });

  //     res.cookie('refresh_token', signInData.session.refresh_token, {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //       sameSite: 'strict',
  //       maxAge: 7 * 24 * 60 * 60 * 1000,
  //       path: '/',
  //     });

  //     res.status(200).json({  message: "User created successfully", userId, session: signInData.session });
  //   }catch (err: any){
  //     console.error(err);
  //     res.status(500).json({ message: err.message || "Signup failed." });
  //   }
  // },

  // signIn: async (req: Request, res: Response) => {
  //   const { email, password } = req.body;
  //   if(!email || !password){
  //     return res.status(400).json({ message: "Email and password required." });
  //   }

  //   try{
  //     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  //     if (error) throw error;

  //     if (!data?.session) {
  //       return res.status(401).json({ 
  //         success: false,
  //         message: "Authentication failed - no session created" 
  //       });
  //     }

  //     const userId =  data.user?.id;
  //     if (!userId) {
  //       console.log("No user returned");
  //       return res.status(401).json({ message: "Invalid credentials" });
  //     }

  //     // Set authentication cookies
  //     res.cookie('access_token', data.session.access_token, {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  //       sameSite: 'strict',
  //       maxAge: 15 * 60 * 1000, // 15 minutes
  //       path: '/', // Available on all routes
  //     });

  //     res.cookie('refresh_token', data.session.refresh_token, {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //       sameSite: 'strict',
  //       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  //       path: '/',
  //     });

  //     // Check if user exists in profiles table
  //     let profile = await UserModel.getUserById(userId);
  //     console.log("Profile:", profile); 
  //     if (!profile) {
  //       return res.status(404).json({ message: "Profile not found. Please sign up first.", user: data.user });
  //     }
  //     res.status(200).json({ 
  //       success: true,
  //       message: "Signed in successfully", 
  //       user: {
  //         ...profile,
  //         email: data.user.email
  //       }
  //     });

  //     // res.status(200).json({ 
  //     //   message: "Signed in successfully", 
  //     //   session: data.session,
  //     //   user: {
  //     //     ...profile,
  //     //     email: data.user.email
  //     //   }
  //     // });
  //   }catch (err: any){
  //     res.status(500).json({ error: err.message });
  //     // let errorMessage = "Sign in failed";
  //     // let statusCode = 500;
      
  //     // if (err.message?.includes("Invalid login credentials")) {
  //     //   errorMessage = "Invalid email or password";
  //     //   statusCode = 401;
  //     // } else if (err.message?.includes("Email not confirmed")) {
  //     //   errorMessage = "Please confirm your email address";
  //     //   statusCode = 403;
  //     // }
      
  //     // res.status(statusCode).json({ 
  //     //   success: false,
  //     //   message: errorMessage,
  //     //   ...(process.env.NODE_ENV === 'development' && { error: err.message })
  //     // });
  //   }
  // },

  // signInWithGoogle: async (req: Request, res: Response) => {
  //   try{
  //     const { data, error } = await supabase.auth.signInWithOAuth({
  //       provider: "google",
  //       options: {
  //         redirectTo: "http://localhost:8080/profile", //test
  //       },
  //     });
  //     if (error) throw error;
  //     res.status(200).json({ url: data.url });
  //   }catch (err: any) {
  //     res.status(500).json({ error: err.message });
  //   }
  // },

  // signOut: async (req: Request, res: Response) => {
  //   try{
  //     const token = req.cookies.access_token;
  //     if (token) {
  //       await supabase.auth.signOut(token);
  //     }
      
  //     // Clear authentication cookies
  //     res.clearCookie('access_token', {
  //       path: '/',
  //     });
      
  //     res.clearCookie('refresh_token', {
  //       path: '/',
  //     });

  //     // Clear any other auth-related cookies
  //     res.clearCookie('sb-access-token', { path: '/' });
  //     res.clearCookie('sb-refresh-token', { path: '/' });

  //     res.status(200).json({ 
  //       success: true,
  //       message: "Signed out successfully." 
  //     });
  //   }catch(err: any){
  //     //clear cookies anyway
  //     res.clearCookie('access_token', { path: '/' });
  //     res.clearCookie('refresh_token', { path: '/' });
  //     res.status(200).json({ 
  //       success: true,
  //       message: "Signed out (session cleared)" 
  //     });
  //     }
  // },

  // refreshToken: async (req: Request, res: Response) => {
  //   try {
  //     const refreshToken = req.cookies.refresh_token;
      
  //     if (!refreshToken) {
  //       return res.status(401).json({ 
  //         success: false,
  //         message: "No refresh token available" 
  //       });
  //     }

  //     const { data, error } = await supabase.auth.refreshSession({
  //       refresh_token: refreshToken
  //     });

  //     if (error) throw error;

  //     if (!data?.session) {
  //       // Clear cookies since refresh failed
  //       res.clearCookie('access_token', { path: '/' });
  //       res.clearCookie('refresh_token', { path: '/' });
        
  //       return res.status(401).json({ 
  //         success: false,
  //         message: "Session expired. Please sign in again.",
  //         code: "SESSION_EXPIRED" 
  //       });
  //     }

  //     // Set new access token cookie
  //     res.cookie('access_token', data.session.access_token, {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //       sameSite: 'strict',
  //       maxAge: 15 * 60 * 1000,
  //       path: '/',
  //     });

  //     // Update refresh token if a new one was provided
  //     if (data.session.refresh_token !== refreshToken) {
  //       res.cookie('refresh_token', data.session.refresh_token, {
  //         httpOnly: true,
  //         secure: process.env.NODE_ENV === 'production',
  //         sameSite: 'strict',
  //         maxAge: 7 * 24 * 60 * 60 * 1000,
  //         path: '/',
  //       });
  //     }

  //     res.status(200).json({ 
  //       success: true,
  //       message: "Token refreshed successfully" 
  //       // ,user: {
  //       //   id: data.user?.id,
  //       //   email: data.user?.email
  //       // }
  //     });
      
  //   } catch (err: any) {
  //     console.error("Token refresh error:", err);
      
  //     // Clear all auth cookies on refresh failure
  //     res.clearCookie('access_token', { path: '/' });
  //     res.clearCookie('refresh_token', { path: '/' });
      
  //     res.status(401).json({ 
  //       success: false,
  //       message: "Session expired. Please sign in again.",
  //       code: "SESSION_EXPIRED"
  //     });
  //   }
  // },

  // getUserById: async (req: Request, res: Response) => {
  //   const userId = (req as any).user.id;
  //   if (!userId) {
  //     return res.status(401).json({ error: "User ID not found in token" });
  //   }
  //   // console.log("[BACKEND] Fetching profile for userId:", userId);
  //   try{
  //     const user = await UserModel.getUserById(userId);
  //     console.log("[BACKEND] Fetched user:", user);
  //     if (!user) {
  //       return res.status(404).json({ error: "User not found" });
  //     }
  //     res.status(200).json({ 
  //       user: {
  //         ...user,
  //         email: (req as any).user.email, // Get email from token
  //         role: (req as any).user.role || user.role
  //       }
  //     });
  //   }catch(err: any){
  //     console.error("[BACKEND] Error in getUserById:", err.message); 
  //     res.status(500).json({ error: err.message });
  //   }
  // },
};