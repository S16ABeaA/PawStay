import { supabaseAdmin } from "../config/supabaseAdmin";

export type Role = "customer" | "proprietor" | "admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

export const userModel = {
  createUser: async ({
    id,
    firstName,
    lastName,
    role = "customer",
  }: User) => {
    const { error } = await supabaseAdmin.from("profiles").insert([
      {
        id,
        first_name: firstName,
        last_name: lastName,
        role,
      },
    ]);

    if(error) throw error;
  },

  getUserById: async (id: string) => {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, last_name, email, role, phone, address, avatar_url")
      .eq("id", id)
      .maybeSingle();
      // .single();
    if (error) throw error;
    return data;
  },

  updateUser: async (
    id: string,
    fields: { first_name?: string; last_name?: string; phone?: string; address?: string; avatar_url?: string }
  ) => {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(fields)
      .eq("id", id)
      .select("id, first_name, last_name, role, phone, address, avatar_url")
      .single();
    if (error) throw error;
    return data;
  },

};