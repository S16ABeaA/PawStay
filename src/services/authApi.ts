import { authHelper } from "../helpers/authHelper";

const API_BASE_URL = "http://localhost:5000";

export const authApi = {
  signUp: async (data: any) => authHelper.post(`${API_BASE_URL}/api/auth/signUp`, data),
  signIn: async (data: any) => authHelper.post(`${API_BASE_URL}/api/auth/signIn`, data),
  signOut: async () => authHelper.post(`${API_BASE_URL}/api/auth/signOut`),
  getProfile: async () => authHelper.get(`${API_BASE_URL}/api/auth/profile`),
};

// export const authApi = {
//   signUp: async (data: {
//     email: string;
//     password: string;
//     firstName: string;
//     lastName: string;
//     isPartner?: boolean;
//   }) => {
//     const res = await fetch(`${API_BASE_URL}/api/auth/signUp`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: 'include',
//       body: JSON.stringify(data),
//     });    
//     return await res.json();
//   },

//   signIn: async (email: string, password: string) => {
//     const res = await fetch(`${API_BASE_URL}/api/auth/signIn`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: 'include',
//       body: JSON.stringify({ email, password }),
//     });
//     const result = await res.json();
    
//     // Save user info to localStorage
//     if (result.user) {
//       localStorage.setItem("user", JSON.stringify(result.user));
//     }
    
//     return result;
//   },

//   signInWithGoogle: async () => {
//     const res = await fetch(`${API_BASE_URL}/api/auth/signInWithGoogle`, {
//       method: "POST",
//       credentials: 'include',
//     });
//     return await res.json();
//   },

//   getProfile: async () => {
//     const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
//       headers: { "Content-Type": "application/json" },
//       credentials: 'include',
//     });
//     return await res.json();
//   },

//   signOut: async () => {
//     const res = await fetch(`${API_BASE_URL}/api/auth/signOut`, {
//       method: "POST",
//       credentials: 'include',
//     });
    
//     // Clear user data from localStorage
//     localStorage.removeItem("user");
//     localStorage.removeItem("authToken");
    
//     return await res.json();
//   },

//   //Token refresh endpoint
//   refreshToken: async () => {
//     const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
//       method: "POST",
//       credentials: 'include',
//     });
//     return await res.json();
//   },
// };

// //Helper functions
// let isRefreshing = false;

// export const AuthHelper = {
//   // Fetch with auto token refresh
//   fetchWithAuth: async (url: string, options: RequestInit = {}) => {
//     const response = await fetch(url, {
//       ...options,
//       credentials: 'include',
//       headers: {
//         'Content-Type': 'application/json',
//         ...options.headers,
//       },
//     });
    
//     if (response.status === 401 && !isRefreshing) {
//       isRefreshing = true;
      
//       try {
//         const refreshResult = await AuthApi.refreshToken();
        
//         if (refreshResult.success) {
//           const retryResponse = await fetch(url, {
//             ...options,
//             credentials: 'include',
//             headers: {
//               'Content-Type': 'application/json',
//               ...options.headers,
//             },
//           });
          
//           isRefreshing = false;
//           return retryResponse;
//         }
//       } catch (refreshError) {
//         console.error('Token refresh failed:', refreshError);
//         AuthHelper.clearUser();
//         window.location.href = '/signin';
//         throw new Error('Session expired. Please sign in again.');
//       }
      
//       isRefreshing = false;
//     }
    
//     return response;
//   },

//   // Convenience methods
//   get: async (url: string, options: RequestInit = {}) => {
//     return AuthHelper.fetchWithAuth(url, { ...options, method: 'GET' });
//   },

//   post: async (url: string, data: any, options: RequestInit = {}) => {
//     return AuthHelper.fetchWithAuth(url, {
//       ...options,
//       method: 'POST',
//       body: JSON.stringify(data),
//     });
//   },

//   put: async (url: string, data: any, options: RequestInit = {}) => {
//     return AuthHelper.fetchWithAuth(url, {
//       ...options,
//       method: 'PUT',
//       body: JSON.stringify(data),
//     });
//   },

//   patch: async (url: string, data: any, options: RequestInit = {}) => {
//     return AuthHelper.fetchWithAuth(url, {
//       ...options,
//       method: 'PATCH',
//       body: JSON.stringify(data),
//     });
//   },

//   delete: async (url: string, options: RequestInit = {}) => {
//     return AuthHelper.fetchWithAuth(url, { ...options, method: 'DELETE' });
//   },

//   // User state management
//   saveUser: (userData: any) => {
//     localStorage.setItem("user", JSON.stringify(userData));
//   },
  
//   getCurrentUser: () => {
//     const userStr = localStorage.getItem('user');
//     if (!userStr) return null;
    
//     try {
//       return JSON.parse(userStr);
//     } catch {
//       return null;
//     }
//   },

//   clearUser: () => {
//     localStorage.removeItem('user');
//     localStorage.removeItem('authToken');
//   },

//   isAuthenticated: () => {
//     return !!AuthHelper.getCurrentUser();
//   },

//   // Initialize user state from localStorage
//   initializeUser: () => {
//     return AuthHelper.getCurrentUser();
//   },
// };

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// export const AuthApi = {
//   signUp: async (data: {
//     email: string;
//     password: string;
//     firstName: string;
//     lastName: string;
//     isPartner?: boolean;
//   }) => {
//     const res = await fetch(`${API_BASE_URL}/api/auth/signUp`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });
//     const result = await res.json();
//     if(result.session?.access_token){
//       localStorage.setItem("authToken", result.session.access_token);
//     }
//     return result;
//   },

//   signIn: async (email: string, password: string) => {
//     const res = await fetch(`${API_BASE_URL}/api/auth/signIn`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ email, password }),
//     });
//     const result = await res.json();
//     if(result.session?.access_token){
//       localStorage.setItem("authToken", result.session.access_token);
//     }
//     return result;
//   },

//   signInWithGoogle: async () => {
//     const res = await fetch(`${API_BASE_URL}/api/auth/signInWithGoogle`, {
//       method: "POST",
//     });
//     return await res.json();
//   },

//   getProfile: async (token: string) => {
//     const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return await res.json();
//   },

//   signOut: async () => {
//     const res = await fetch(`${API_BASE_URL}/api/auth/signOut`, {
//       method: "POST",
//     });
//     // localStorage.removeItem("authToken");
//     return await res.json();
//   },
// };