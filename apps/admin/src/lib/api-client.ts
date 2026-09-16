const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
    let json: any = {};
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text, success: res.ok };
    }

    if (!res.ok) {
      return {
        success: false,
        error: json.error || json.message || `HTTP Error ${res.status}`,
      };
    }

    return {
      success: json.success ?? true,
      data: json.data ?? json,
      message: json.message,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to communicate with API server.",
    };
  }
}
