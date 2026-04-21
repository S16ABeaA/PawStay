import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabaseAdmin";
import { supabaseClient } from "../config/supabaseClient";
import { userModel } from "../models/userModel";
import { clearAuthCookies, setAuthCookies } from "../middleware/authMiddleware";
import { logger } from "../utils/logger";

const isProd = process.env.NODE_ENV === "production";
const sameSitePolicy: "lax" | "none" = isProd ? "none" : "lax";

export const authController = {
  signUp: async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, isPartner } = req.body;
    const isPartnerSignup = isPartner === true || isPartner === "true";

    const role = isPartnerSignup ? "proprietor" : "customer";

    if(!email || !password || !firstName || !lastName){
      return res.status(400).json({ message: "All fields are required." });
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      return res.status(400).json({ error: "Password must be at least 8 characters with uppercase, lowercase, number, and special character." });
    }

    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const userExists = existingUser?.users?.some(u => u.email === email);
      if (userExists) {
          logger.warn("signUp failed", { code: 409 });
          return res.status(400).json({ error: "Unable to process signup." });
      }

      // Test 1: List all users (admin only)
      // const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      // console.log("Admin users test:", { users: users?.users?.length, usersError });

      // Create user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        // email_confirm: true, // Skip email confirmation for testing
        user_metadata: { firstName, lastName, role }
      });
      if (signUpError) {
        logger.warn("signUp failed", { code: (signUpError as any)?.status });
        return res.status(500).json({ error: "Internal server error." });
      }

      const userId = signUpData.user?.id;
      if (!userId) throw new Error("User ID not returned from Supabase");

      const { error: profileUpsertError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            first_name: firstName,
            last_name: lastName,
            role,
          },
          { onConflict: "id" }
        );

      if (profileUpsertError) {
        logger.warn("auth failed", { code: (profileUpsertError as any)?.status });
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return res.status(500).json({ error: "Failed to create profile." });
      }

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
      logger.warn("signUp failed", { code: err?.status });
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  resendConfirmation: async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // Check if already confirmed
    if (user.confirmed_at) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    // check last resend timestamp from your DB
    // const profile = await userModel.getUserById(user.id);
    // const lastSent = profile?.last_confirmation_sent;
    // if (lastSent && Date.now() - lastSent < 45000) { // 45s cooldown
    //   return res.status(429).json({ message: "Please wait before resending email." });
    // }

    try {
      const frontendUrl = process.env.VITE_FRONTEND_URL || process.env.FRONTEND_URL || "http://localhost:8080";
      const { error } = await supabaseClient.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${frontendUrl}/check-email?confirmed=true`
        }
      });

      if (error) {
        return res.status(500).json({ message: "Unable to resend confirmation email right now." });
      }

      // update last resend timestamp in DB
      // await userModel.updateUser(user.id, { last_confirmation_sent: Date.now() });

      return res.status(200).json({ message: "Confirmation email resent successfully." });
    } catch (err: any) {
      logger.warn("resendConfirmation failed", { code: err?.status });
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
      if (signInError) {
        logger.warn("signIn failed", { code: signInError.status });
        return res.status(401).json({ error: "Invalid credentials." });
      }

      if (!signInData.user?.email_confirmed_at) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      const userId = signInData.user.id;

      // Set Supabase auth cookies with consistent policy
      setAuthCookies(res, signInData.session);

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
        email: userProfile.email || signInData.user?.email,
      };
      return res.json({ user });
    } catch (err: any) {
      logger.warn("signIn failed", { code: err?.status });
      return res.status(401).json({ error: "Invalid credentials." });
    }
  },

  signInWithGoogle: async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${process.env.BACKEND_URL}/api/auth/oauth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) {
        logger.warn("signInWithGoogle failed", { code: (error as any)?.status });
        return res.status(401).json({ error: "Invalid credentials." });
      }

      return res.json({ url: data.url });

    } catch (err: any) {
      logger.warn("signInWithGoogle failed", { code: err?.status });
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  oauthCallback: async (req: Request, res: Response) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}/signin?error=missing_code`);
      }

      const { data, error } = await supabaseClient.auth.exchangeCodeForSession(
        code as string
      );

      if (error) {
        return res.redirect(`${process.env.FRONTEND_URL}/signin?error=auth_failed`);
      }

      if (!data.session) {
        return res.redirect(`${process.env.FRONTEND_URL}/signin?error=session_failed`);
      }

      // Set cookies
      setAuthCookies(res, data.session);
      
      // Set user session marker
      if (data.session.user) {
        const userId = data.session.user.id;
        res.cookie("session", userId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      }
      
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:8080"}/oauth/callback`);

    } catch (err: any) {
      return res.redirect(`${process.env.FRONTEND_URL}/signin?error=server_error`);
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    try {
      const frontendUrl =
        process.env.FRONTEND_URL || "http://localhost:8080";

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${frontendUrl}/forgot-password`,
      });

      if (error) {
        logger.warn("forgotPassword failed", { code: (error as any)?.status });
        return res.status(500).json({ error: "Internal server error." });
      }

      return res.status(200).json({
        message: "Password reset email sent successfully.",
      });
    } catch (err: any) {
      logger.warn("forgotPassword failed", { code: err?.status });
      return res.status(500).json({ error: "Internal server error." });
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
          email: userProfile.email || user.email, // Get email from DB or token
          email_confirmed_at: user.email_confirmed_at || null,
          is_verified: Boolean(user.email_confirmed_at),
        }
      });
    }catch(err: any){
      logger.error("getProfile error", err);
      res.status(500).json({ error: "Internal server error." });
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { firstName, lastName, phone, address } = req.body;

    // Build update payload – only include fields that were provided
    const fields: Record<string, string> = {};
    if (firstName !== undefined) fields.first_name = firstName;
    if (lastName !== undefined) fields.last_name = lastName;
    if (phone !== undefined) fields.phone = phone;
    if (address !== undefined) fields.address = address;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "No fields to update." });
    }

    try {
      const updatedProfile = await userModel.updateUser(user.id, fields);
      return res.status(200).json({
        message: "Profile updated successfully.",
        user: {
          id: updatedProfile.id,
          first_name: updatedProfile.first_name,
          last_name: updatedProfile.last_name,
          role: updatedProfile.role,
          phone: updatedProfile.phone || "",
          address: updatedProfile.address || "",
          avatar_url: updatedProfile.avatar_url || "",
          email: user.email,
        },
      });
    } catch (err: any) {
      logger.warn("updateProfile failed", { code: err?.status });
      return res.status(500).json({ error: "Failed to update profile." });
    }
  },

  uploadAvatar: async (req: Request, res: Response) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG and WebP are allowed." });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
    }

    try {
      const ext = file.originalname.split(".").pop() || "jpg";
      const filePath = `${user.id}/avatar.${ext}`;

      // Upload to Supabase Storage (avatars bucket)
      const { error: uploadError } = await supabaseAdmin.storage
        .from("avatars")
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true, // Overwrite existing avatar
        });

      if (uploadError) {
        logger.warn("auth failed", { code: (uploadError as any)?.status });
        return res.status(500).json({ error: "Failed to upload avatar." });
      }

      // Get the public URL
      const { data: urlData } = supabaseAdmin.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Append cache-busting timestamp so browsers always fetch the new image
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update the profile with the new avatar URL
      await userModel.updateUser(user.id, { avatar_url: avatarUrl });

      return res.status(200).json({
        message: "Avatar uploaded successfully.",
        avatar_url: avatarUrl,
      });
    } catch (err: any) {
      logger.warn("auth failed", { code: err?.status });
      return res.status(500).json({ error: "Failed to upload avatar." });
    }
  },

  listUsers: async (req: Request, res: Response) => {
    try {
      const [profilesResult, authResult] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, first_name, last_name, email, role, phone, address, avatar_url, created_at")
          .eq("is_deleted", false)
          .order("created_at", { ascending: false }),
        supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      ]);

      if (profilesResult.error) {
        logger.warn("listUsers failed", { code: (profilesResult.error as any)?.status });
        return res.status(500).json({ error: "Internal server error." });
      }
      if (authResult.error) {
        logger.warn("listUsers failed", { code: (authResult.error as any)?.status });
        return res.status(500).json({ error: "Internal server error." });
      }

      const authMap = new Map(
        authResult.data.users.map((u) => [u.id, u])
      );

      const users = (profilesResult.data ?? []).map((p) => {
        const au = authMap.get(p.id);
        return {
          ...p,
          email_confirmed_at: au?.email_confirmed_at ?? null,
          banned_until:       au?.banned_until ?? null,
        };
      });

      return res.json({ users });
    } catch (err: any) {
      console.error("[listUsers] Error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  banUser: async (req: Request, res: Response) => {
    const requester = (req as any).user;
    if (!requester || requester.role !== "super_admin") {
      return res.status(403).json({ error: "Forbidden." });
    }
    const { id } = req.params;
    const ban = req.body?.ban ?? req.body?.banned;
    const userId = Array.isArray(id) ? id[0] : id;
    if (!userId) return res.status(400).json({ error: "User id is required." });
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: ban ? "876000h" : "none",
      });
      if (error) {
        logger.warn("banUser failed", { code: (error as any)?.status });
        return res.status(500).json({ error: "Internal server error." });
      }
      console.log(`[banUser] ${requester.email} ${ban ? "suspended" : "reinstated"} user ${id}`);
      return res.json({ message: ban ? "User suspended." : "User reinstated." });
    } catch (err: any) {
      console.error("[banUser] Error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  deleteUser: async (req: Request, res: Response) => {
    const requester = (req as any).user;
    if (!requester || requester.role !== "super_admin") {
      return res.status(403).json({ error: "Forbidden." });
    }
    const { id } = req.params;
    const userId = Array.isArray(id) ? id[0] : id;
    if (!userId) return res.status(400).json({ error: "User id is required." });
    if (userId === requester.id) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }
    try {
      // Delete from Supabase Auth (profiles cascade via FK if set, else clean up explicitly)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        logger.warn("deleteUser failed", { code: (authError as any)?.status });
        return res.status(500).json({ error: "Internal server error." });
      }
      // Explicit profile cleanup in case FK cascade is not configured
      await supabaseAdmin.from("profiles").delete().eq("id", id);
      console.log(`[deleteUser] ${requester.email} deleted user ${id}`);
      return res.json({ message: "User permanently deleted." });
    } catch (err: any) {
      console.error("[deleteUser] Error:", err);
      return res.status(500).json({ error: "Internal server error." });
    }
  },

  promoteUser: async (req: Request, res: Response) => {
    const requester = (req as any).user;
    if (!requester || requester.role !== "super_admin") {
      return res.status(403).json({ error: "Forbidden: super admin access required." });
    }

    const { email: rawEmailOrId, user_id, role } = req.body;
    const emailOrId = user_id || rawEmailOrId;
    const allowedRoles = ["customer", "proprietor", "admin", "super_admin"];

    if (!emailOrId || !role) {
      return res.status(400).json({ error: "user_id and role are required." });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${allowedRoles.join(", ")}.` });
    }

    try {
      const candidate = String(emailOrId);
      const isUuidCandidate = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate);

      const profileQuery = supabaseAdmin
        .from("profiles")
        .select("id, email")
        .eq("is_deleted", false);

      const { data: profile, error: profileLookupError } = await (isUuidCandidate
        ? profileQuery.eq("id", candidate).maybeSingle()
        : profileQuery.eq("email", candidate).maybeSingle());

      if (profileLookupError) {
        logger.warn("promoteUser failed", { code: (profileLookupError as any)?.status });
        return res.status(500).json({ error: "Internal server error." });
      }
      if (!profile) {
        return res.status(404).json({ error: `No user found for identifier: ${candidate}` });
      }

      // Fetch the auth user by ID (reliable, no pagination)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      if (authError || !authData?.user) {
        return res.status(404).json({ error: `Auth record not found for identifier: ${candidate}` });
      }
      const authUser = authData.user;

      // Update role in profiles table
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ role })
        .eq("id", authUser.id);

      if (profileError) {
        logger.warn("promoteUser failed", { code: (profileError as any)?.status });
        return res.status(500).json({ error: "Internal server error." });
      }

      // Update user_metadata in Supabase Auth
      const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        user_metadata: { ...authUser.user_metadata, role },
      });

      if (metaError) {
        logger.warn("promoteUser failed", { code: (metaError as any)?.status });
        return res.status(500).json({ error: "Internal server error." });
      }

      const resolvedEmail = profile.email || authUser.email || candidate;
      console.log(`[promoteUser] ${requester.email} promoted ${resolvedEmail} to ${role}`);
      return res.json({ message: `User ${resolvedEmail} has been promoted to ${role}.` });
    } catch (err: any) {
      console.error("[promoteUser] Error:", err);
      return res.status(500).json({ error: "Internal server error." });
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