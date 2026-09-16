const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers,
    });

    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = { message: text, success: res.ok };
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error:
          typeof json.error === "string"
            ? json.error
            : typeof json.message === "string"
            ? json.message
            : `HTTP Error ${res.status}`,
      };
    }

    return {
      success: typeof json.success === "boolean" ? json.success : true,
      status: res.status,
      data: (json.data ?? json) as T,
      message: typeof json.message === "string" ? json.message : undefined,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to communicate with API server.",
    };
  }
}
