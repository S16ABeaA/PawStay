import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_PAW_STAY_SUPABASE_URL ??
  import.meta.env.VITE_SUPABASE_URL ??
  (typeof process !== "undefined" ? process.env.PAW_STAY_SUPABASE_URL : undefined);
const supabaseAnonKey =
  import.meta.env.VITE_PAW_STAY_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  (typeof process !== "undefined" ? process.env.PAW_STAY_SUPABASE_ANON_KEY : undefined);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "[supabase] Missing env vars. Set VITE_PAW_STAY_SUPABASE_URL / VITE_PAW_STAY_SUPABASE_ANON_KEY (or VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
export { supabase };