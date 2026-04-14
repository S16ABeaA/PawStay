const normalizePathname = (url: string): string => {
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return new URL(url).pathname;
    }
    return new URL(url, window.location.origin).pathname;
  } catch {
    const [pathOnly] = String(url || "").split("?");
    return pathOnly || "/";
  }
};

const PROTECTED_PREFIXES = [
  "/api/admin",
  "/api/ai",
  "/api/analytics",
  "/api/favorites",
  "/api/notifications",
  "/api/pets",
  "/api/settings",
  "/api/settlements",
  "/api/submit-property",
  "/api/support",
];

const PROTECTED_EXACT = new Set([
  "/api/auth/profile",
  "/api/auth/updateProfile",
  "/api/auth/uploadAvatar",
  "/api/auth/signOut",
  "/api/auth/promote",
  "/api/properties/recommended",
  "/api/properties/mine",
  "/api/reviews/mine",
]);

const isAuthenticatedEndpoint = (url: string, method?: string): boolean => {
  const pathname = normalizePathname(url);
  const verb = String(method || "GET").toUpperCase();

  if (PROTECTED_EXACT.has(pathname)) return true;
  if (PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }

  if (pathname === "/api/platform-settings") {
    return verb !== "GET";
  }

  if (pathname.startsWith("/api/amenities")) {
    return pathname !== "/api/amenities/servicetype";
  }

  if (pathname === "/api/bookings" || pathname.startsWith("/api/bookings/")) {
    return !pathname.startsWith("/api/bookings/availability/");
  }

  if (pathname === "/api/auth/users" || pathname.startsWith("/api/auth/users/")) return true;

  if (pathname === "/api/properties/mine" || pathname.startsWith("/api/properties/mine/")) return true;
  if (/^\/api\/properties\/[^/]+\/services(?:\/[^/]+)?$/.test(pathname)) {
    return verb !== "GET";
  }

  if (pathname === "/api/reviews") return verb === "POST";
  if (/^\/api\/reviews\/check\/.+/.test(pathname)) return true;
  if (/^\/api\/reviews\/[^/]+\/reply$/.test(pathname)) return true;

  return false;
};

export const authHelper = {
  fetchWithAuth: async (url: string, options: RequestInit = {}) => {
    console.log("Fetching with auth:", url, options); // Debug log to see the request details
    const credentials = options.credentials ?? (isAuthenticatedEndpoint(url, options.method) ? "include" : "omit");
    const res = await fetch(url, { ...options, credentials, cache: "no-store" });
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let data: any;
    if (isJson) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = {
        error: res.ok ? "Unexpected non-JSON response" : "Request failed",
        details: text?.slice(0, 500) || "No response body",
        status: res.status,
      };
    }

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