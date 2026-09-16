// Same-origin: the browser talks only to the admin host, and Next rewrites
// /api/* through to the real API server-side. This keeps session cookies
// first-party — cross-origin fetch (admin :3002 -> api :3001) silently drops
// SameSite=Lax cookies, which made logins bounce forever despite 200s.
const API_BASE_URL = "/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string }> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const text = await res.text();
    let json: { error?: unknown; message?: unknown; success?: unknown; data?: unknown } = {};
    try {
      const parsed: unknown = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        json = parsed as typeof json;
      }
    } catch {
      json = { message: text, success: res.ok };
    }

    if (!res.ok) {
      const errMsg = [json.error, json.message].find((v): v is string => typeof v === "string");
      return {
        success: false,
        error: errMsg ?? `HTTP Error ${res.status}`,
      };
    }

    return {
      success: typeof json.success === "boolean" ? json.success : true,
      data: (json.data ?? json) as T | undefined,
      message: typeof json.message === "string" ? json.message : undefined,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to communicate with API server.",
    };
  }
}
