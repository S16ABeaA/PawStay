const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
export const AuthApi = {
  signUp: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    isPartner?: boolean;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  },

  signIn: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  },

  signInWithGoogle: async () => {
    const res = await fetch(`${API_BASE_URL}/api/auth/signInWithGoogle`, {
      method: "POST",
    });
    return await res.json();
  },

  logout: async () => {
    const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
    });
    return await res.json();
  },
};

// import { supabase } from "../config/supabaseClient";

// export const AuthService = {
//   signUp: async ({
//     email,
//     password,
//     firstName,
//     lastName,
//     isPartner = false
//     }:{
//     email: string,
//     password: string,
//     firstName: string,
//     lastName: string,
//     isPartner?: boolean
//   }) => {
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         emailRedirectTo: "http://localhost:8080/profile", //test
//         data: { firstName, lastName, isPartner },
//       },
//     });

//     if (error) throw error;

//     const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     // Insert into users table
//     // await supabase.from("users").insert([{
//     //   id: data.user?.id,
//     //   first_name: firstName,
//     //   last_name: lastName,
//     //   role: isPartner ? "proprietor" : "customer",
//     // }]);

//     const { error: userError } = await supabase.from("users").insert([{
//       id: data.user?.id,
//       first_name: firstName,
//       last_name: lastName,
//       role: isPartner ? "proprietor" : "customer",
//     }]);

//     if (userError) {
//       console.error("Failed to insert user into users table:", userError);
//       throw userError;
//     }

//     return data.user;
//   },

//   signIn: async (email: string, password: string) => {
//     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//     if (error) throw error;
//     return data.session;
//   },

//   signInWithGoogle: async () => {
//     const { data, error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: { redirectTo: window.location.origin },
//     });
//     if (error) throw error;
//     return data;
//   },

//   signOut: async () => {
//     const { error } = await supabase.auth.signOut();
//     if (error) throw error;
//   },

//   getSession: async () => {
//     const { data } = await supabase.auth.getSession();
//     return data.session;
//   },

//   onAuthStateChange: (callback: (event: string, session: any) => void) => {
//     const { data } = supabase.auth.onAuthStateChange(callback);
//     return data.subscription;
//   },
// };