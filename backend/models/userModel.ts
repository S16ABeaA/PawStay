import { supabase } from "../config/superbaseAdmin";

export type Role = "customer" | "proprietor" | "admin";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

export const UserModel = {
  createUser: async ({
    id,
    firstName,
    lastName,
    role = "customer",
  }: User) => {
    const { error } = await supabase.from("users").insert([
      {
        id,
        first_name: firstName,
        last_name: lastName,
        role,
      },
    ]);

    if(error) throw error;
  },

//   findById: async (id: string) => {
//     const { data, error } = await supabase
//       .from("users")
//       .select("*")
//       .eq("id", id)
//       .single();

//     if (error) throw error;
//     return data;
//   },
};