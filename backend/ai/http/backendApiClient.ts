interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  authToken?: string;
}

const API_BASE_URL = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5001}`;

const buildUrl = (path: string, query?: ApiRequestOptions["query"]): string => {
  const url = new URL(path, API_BASE_URL);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
};

export const backendApiClient = {
  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { method = "GET", query, body, authToken } = options;

    const response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Backend API ${method} ${path} failed: ${response.status} ${errorBody}`);
    }

    return response.json() as Promise<T>;
  },
};
