import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
dotenv.config({ path: ".env" });

// Check if env vars are loaded
// console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
// console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_PAW_STAY_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase admin environment variables.");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);