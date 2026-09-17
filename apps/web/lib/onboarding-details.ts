import { apiBaseUrl } from "./auth-client";

/**
 * Persists the select-mode popup fields (name, phone, registration number)
 * onto the signed-in user's DB row. Returns an error message, or null on
 * success. Callers should block on failure so the DB never disagrees with
 * what the pass later displays.
 */
export async function saveOnboardingDetails(input: {
  fullName: string;
  phoneNumber: string;
  registrationNumber: string;
}): Promise<string | null> {
  try {
    const res = await fetch(`${apiBaseUrl}/users/me/details`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      // Without this, a slow/cold API leaves the popup stuck on
      // "SAVING..." forever — fail into a retryable message instead.
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        name: input.fullName.trim(),
        phone: input.phoneNumber.trim(),
        reg_number: input.registrationNumber.trim(),
      }),
    });
    if (!res.ok) {
      // 409 = reg number belongs to someone else; the message is user-facing.
      if (res.status === 409) {
        const errBody = await res.json().catch(() => ({}));
        return (
          (errBody as { error?: string }).error ||
          "This registration number is already registered. Please check it and try again."
        );
      }
      const errBody = await res.json().catch(() => ({}));
      return (errBody as { error?: string }).error || "Could not save your details. Please retry.";
    }
    return null;
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return "Server is taking too long. Please retry — your details were not saved yet.";
    }
    return "Could not reach the server. Check connection and retry.";
  }
}
