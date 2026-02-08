import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_PAW_STAY_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PAW_STAY_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[supabase] Missing env vars. Set VITE_PAW_STAY_SUPABASE_URL / VITE_PAW_STAY_SUPABASE_ANON_KEY."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
export { supabase };