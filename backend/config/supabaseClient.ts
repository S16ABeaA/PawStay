import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config({ path: ".env" });

// console.log("SUPABASE_URL:", process.env.PAW_STAY_SUPABASE_URL);
// console.log("SUPABASE_ANON_KEY:", process.env.VITE_PAW_STAY_SUPABASE_ANON_KEY);

const supabaseUrl = process.env.PAW_STAY_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_PAW_STAY_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase client environment variables.");
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);