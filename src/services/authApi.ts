import { authHelper } from "../helpers/authHelper";

const API_BASE_URL = "http://localhost:5000";

export const authApi = {
  signUp: async (data: any) => authHelper.post(`${API_BASE_URL}/api/auth/signUp`, data),
  resendConfirmation: async (data: any) => authHelper.post(`${API_BASE_URL}/api/auth/resendConfirmation`, data),
  signIn: async (data: any) => authHelper.post(`${API_BASE_URL}/api/auth/signIn`, data),
  signInWithGoogle: async () => authHelper.post(`${API_BASE_URL}/api/auth/signIn`),
  signOut: async () => authHelper.post(`${API_BASE_URL}/api/auth/signOut`),
  getProfile: async () => authHelper.get(`${API_BASE_URL}/api/auth/profile`),
};