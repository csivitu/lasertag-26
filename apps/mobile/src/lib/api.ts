import Constants from "expo-constants";
import { Platform } from "react-native";

function getApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Automatically detect developer machine IP from Expo host URI
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:3001`;
    }
  }

  return Platform.select({
    android: "http://10.0.2.2:3001",
    default: "http://localhost:3001",
  });
}

export const API_BASE_URL = getApiBaseUrl();

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || json.message || "API error" };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to connect to backend (${API_BASE_URL}). Ensure API server is running on port 3001.`,
    };
  }
}
