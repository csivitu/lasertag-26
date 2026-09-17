"use client";

/**
 * VIT-domain helpers for the internal/external sign-in split.
 *
 * Internal (default): must sign in with a VIT student email. The reg number
 * is derived from that identity, shown on the pass, and locked from editing.
 *
 * External: enters through the "External Participant?" link, which sets a
 * one-shot localStorage flag consumed after the OAuth round-trip. Any email
 * domain is accepted; reg number is recorded as "N/A" (phone + name still
 * collected, booking flow identical).
 */

export const VIT_DOMAINS = ["vitstudent.ac.in"] as const;

export const EXTERNAL_SIGNIN_FLAG = "lasertag_external_signin";

export const EXTERNAL_REG_NUMBER = "N/A";

export function isVitEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return (VIT_DOMAINS as readonly string[]).includes(domain);
}

/** One-shot external intent, set before OAuth redirect and cleared on consume. */
export function markExternalSignin(): void {
  try {
    localStorage.setItem(EXTERNAL_SIGNIN_FLAG, "1");
  } catch {}
}

export function consumeExternalSignin(): boolean {
  try {
    if (localStorage.getItem(EXTERNAL_SIGNIN_FLAG) === "1") {
      localStorage.removeItem(EXTERNAL_SIGNIN_FLAG);
      return true;
    }
  } catch {}
  return false;
}

/** Drops a stale external intent (e.g. link clicked but popup closed). */
export function clearExternalSignin(): void {
  try {
    localStorage.removeItem(EXTERNAL_SIGNIN_FLAG);
  } catch {}
}
