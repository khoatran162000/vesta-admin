/**
 * FILE: api.ts
 * PATH: apps/admin/src/lib/api.ts
 * MÔ TẢ: Axios instance + JWT interceptors cho Admin Portal
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

interface FetchOptions extends RequestInit {
  needsAuth?: boolean;
}

export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { needsAuth = true, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = { ...(customHeaders as Record<string, string>) };

  if (needsAuth) {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  // Không set Content-Type nếu body là FormData (browser tự set boundary)
  if (!(rest.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...rest, headers });

  // Token hết hạn → thử refresh
  if (res.status === 401 && needsAuth) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = localStorage.getItem("accessToken");
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${API_URL}${endpoint}`, { ...rest, headers });
      return retryRes.json();
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/dang-nhap";
      throw new Error("Session expired");
    }
  }

  return res.json();
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Shorthand methods
export const api = {
  get: <T = any>(url: string) => apiFetch<T>(url),
  post: <T = any>(url: string, body?: any) =>
    apiFetch<T>(url, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T = any>(url: string, body?: any) =>
    apiFetch<T>(url, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T = any>(url: string, body?: any) =>
    apiFetch<T>(url, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T = any>(url: string) => apiFetch<T>(url, { method: "DELETE" }),
  public: <T = any>(url: string) => apiFetch<T>(url, { needsAuth: false }),
};

export function getImageUrl(path: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL.replace(/\/api$/, "")}${path}`;
}