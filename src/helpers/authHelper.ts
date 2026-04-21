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

const PUBLIC_AUTH_ENDPOINTS = new Set([
  "/api/auth",
  "/api/auth/login",
  "/api/auth/signin",
  "/api/auth/signIn",
  "/api/auth/signup",
  "/api/auth/signUp",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/forgotPassword",
  "/api/auth/reset-password",
  "/api/auth/resetPassword",
  "/api/auth/verify-email",
  "/api/auth/verifyEmail",
]);

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

let csrfTokenCache: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;
let csrfTokenOrigin: string | null = null;

const toRequestError = (data: any, status: number) => {
  if (typeof data === "object" && data !== null) {
    return { ...data, status: data.status ?? status };
  }
  return { error: data, status };
};

const parseResponseBody = async (res: Response): Promise<any> => {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (isJson) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return {
      error: res.ok ? "Unexpected non-JSON response" : "Request failed",
      details: text.slice(0, 500) || "No response body",
      status: res.status,
    };
  }
};

const isApiEndpoint = (url: string): boolean => {
  const pathname = normalizePathname(url);
  return pathname.startsWith("/api/") || pathname === "/api";
};

const isMutatingRequest = (method?: string): boolean => {
  return MUTATING_METHODS.has(String(method || "GET").toUpperCase());
};

const resolveRequestOrigin = (url: string): string => {
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return new URL(url).origin;
    }
    return window.location.origin;
  } catch {
    return window.location.origin;
  }
};

const resolveCsrfUrl = (url: string): string => {
  const origin = resolveRequestOrigin(url);
  return `${origin}/api/auth/csrf-token`;
};

const clearCsrfTokenCache = () => {
  csrfTokenCache = null;
  csrfTokenPromise = null;
  csrfTokenOrigin = null;
};

const fetchCsrfToken = async (url: string, force = false): Promise<string> => {
  const requestOrigin = resolveRequestOrigin(url);

  if (!force && csrfTokenCache && csrfTokenOrigin === requestOrigin) {
    return csrfTokenCache;
  }

  if (!force && csrfTokenPromise && csrfTokenOrigin === requestOrigin) {
    return csrfTokenPromise;
  }

  csrfTokenOrigin = requestOrigin;
  const csrfUrl = resolveCsrfUrl(url);

  csrfTokenPromise = fetch(csrfUrl, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  })
    .then(async (res) => {
      const data = await parseResponseBody(res);
      if (!res.ok || !data?.csrfToken) {
        throw toRequestError(data, res.status);
      }
      csrfTokenCache = data.csrfToken;
      return data.csrfToken as string;
    })
    .finally(() => {
      csrfTokenPromise = null;
    });

  return csrfTokenPromise;
};

const isAuthenticatedEndpoint = (url: string, method?: string): boolean => {
  const pathname = normalizePathname(url);
  const verb = String(method || "GET").toUpperCase();

  if (PUBLIC_AUTH_ENDPOINTS.has(pathname)) {
    return true;
  }

  if (pathname.startsWith("/api/auth/")) {
    return true;
  }

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
    const mutating = isMutatingRequest(options.method);
    const isApi = isApiEndpoint(url);
    const shouldIncludeCredentials = isAuthenticatedEndpoint(url, options.method);
    const credentials = options.credentials ?? (shouldIncludeCredentials || (isApi && mutating) ? "include" : "omit");

    const headers = new Headers(options.headers || undefined);
    if (isApi && mutating) {
      const csrfToken = await fetchCsrfToken(url);
      headers.set("X-CSRF-Token", csrfToken);
    }

    let res = await fetch(url, { ...options, credentials, cache: "no-store", headers });

    if (isApi && mutating && res.status === 403) {
      const retryHeaders = new Headers(options.headers || undefined);
      clearCsrfTokenCache();
      const csrfToken = await fetchCsrfToken(url, true);
      retryHeaders.set("X-CSRF-Token", csrfToken);
      res = await fetch(url, { ...options, credentials, cache: "no-store", headers: retryHeaders });
    }

    const data = await parseResponseBody(res);

    if (!res.ok) throw toRequestError(data, res.status);
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

  clearCsrfTokenCache,
};