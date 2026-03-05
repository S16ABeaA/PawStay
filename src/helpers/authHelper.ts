export const authHelper = {
  fetchWithAuth: async (url: string, options: RequestInit = {}) => {
    console.log("Fetching with auth:", url, options); // Debug log to see the request details
    const res = await fetch(url, { ...options, credentials: "include", cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },

  get: (url: string, options: RequestInit = {}) => 
    authHelper.fetchWithAuth(url, { 
      ...options, 
      method: "GET" 
    }),
  post: (url: string, data?: any, options: RequestInit = {}) => 
    authHelper.fetchWithAuth(url, { 
      ...options, 
      method: "POST", 
      body: JSON.stringify(data), 
      headers: { "Content-Type": "application/json", ...options.headers } 
    }),
  put: (url: string, data: any, options: RequestInit = {}) => 
    authHelper.fetchWithAuth(url, { 
      ...options, 
      method: "PUT", 
      body: JSON.stringify(data), 
      headers: { "Content-Type": "application/json", ...options.headers } 
    }),
  patch: (url: string, data: any, options: RequestInit = {}) => 
    authHelper.fetchWithAuth(url, { 
      ...options, 
      method: "PATCH", 
      body: JSON.stringify(data), 
      headers: { "Content-Type": "application/json", ...options.headers } 
    }),
  delete: (url: string, options: RequestInit = {}) => 
    authHelper.fetchWithAuth(url, { 
      ...options, 
      method: "DELETE" 
    }),
};