import { authHelper } from "../helpers/authHelper";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

export const authApi = {
  signUp: async (data: any) => authHelper.post(`${API_BASE_URL}/api/auth/signUp`, data),
  resendConfirmation: async (data: any) => authHelper.post(`${API_BASE_URL}/api/auth/resendConfirmation`, data),
  signIn: async (data: any) => authHelper.post(`${API_BASE_URL}/api/auth/signIn`, data),
  signInWithGoogle: async () => authHelper.get(`${API_BASE_URL}/api/auth/signInWithGoogle`),
  forgotPassword: async (data: any) => authHelper.post(`${API_BASE_URL}/api/auth/forgotPassword`, data),
  signOut: async () => authHelper.post(`${API_BASE_URL}/api/auth/signOut`),
  getProfile: async () => authHelper.get(`${API_BASE_URL}/api/auth/profile`),
  updateProfile: async (data: any) => authHelper.put(`${API_BASE_URL}/api/auth/updateProfile`, data),
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await fetch(`${API_BASE_URL}/api/auth/uploadAvatar`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
};