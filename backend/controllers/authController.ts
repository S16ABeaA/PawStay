import { Request, Response } from "express";
import { supabase } from "../config/superbaseAdmin";
import { UserModel } from "../models/userModel";

export const authController = {
  signUp: async (req: Request, res: Response) => {
    const { email, password, firstName, lastName, isPartner } = req.body;

    if(!email || !password || !firstName || !lastName){
      return res.status(400).json({ message: "All fields are required." });
    }

    try{
      //Create user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        // email_confirm: true,
        user_metadata: { firstName, lastName, role: isPartner ? "proprietor" : "customer" }
      });
      if (error) throw error;

      //Insert user in users table
      const userId = data.user?.id;
      if (!userId) throw new Error("User ID not returned from Supabase");

      await UserModel.createUser({
        id: userId,
        firstName,
        lastName,
        role: isPartner ? "proprietor" : "customer",
      });

      res.status(200).json({  message: "User created successfully", userId });
    }catch (err: any){
      console.error(err);
      res.status(500).json({ message: err.message || "Signup failed." });
    }
  },

  signIn: async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if(!email || !password){
      return res.status(400).json({ message: "Email and password required." });
    }

    try{
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      res.status(200).json({ message: "Signed in successfully", session: data.session });
    }catch (err: any){
      res.status(500).json({ error: err.message });
    }
  },

  signInWithGoogle: async (req: Request, res: Response) => {
    try{
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "http://localhost:8080/profile", //test
        },
      });
      if (error) throw error;
      res.status(200).json({ url: data.url });
    }catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  signOut: async (req: Request, res: Response) => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      res.status(200).json({ message: "Signed out successfully." });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Signout failed." });
    }
  },
};