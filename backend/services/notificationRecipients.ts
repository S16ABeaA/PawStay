import { supabaseAdmin } from "../config/supabaseAdmin";

export const getSuperAdminRecipients = async (): Promise<Array<{ id: string }>> => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("role", "super_admin")
    .eq("is_deleted", false);

  if (error) throw error;
  return (data ?? []).map((row: any) => ({ id: row.id }));
};
