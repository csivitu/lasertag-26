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
      body: JSON.stringify({
        name: input.fullName.trim(),
        phone: input.phoneNumber.trim(),
        reg_number: input.registrationNumber.trim(),
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return errBody.error || "Could not save your details. Please retry.";
    }
    return null;
  } catch {
    return "Could not reach the server. Check connection and retry.";
  }
}
