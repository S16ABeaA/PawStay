import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

// console.log("SUPABASE_URL:", process.env.VITE_PAW_STAY_SUPABASE_URL);
// console.log("SUPABASE_ANON_KEY:", process.env.VITE_PAW_STAY_SUPABASE_ANON_KEY);

export const supabaseClient = createClient(
  process.env.VITE_PAW_STAY_SUPABASE_URL!,
  process.env.VITE_PAW_STAY_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce', // Force PKCE flow
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);