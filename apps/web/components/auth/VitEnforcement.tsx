"use client";

import { useEffect, useRef, useState } from "react";
import { apiBaseUrl, signOut, useSession } from "@/lib/auth-client";
import { consumeExternalSignin, isVitEmail } from "@/lib/vit";
import { AuthModal } from "./AuthModal";

/**
 * Global VIT-domain enforcement for the default sign-in path. Mounted once
 * in the root layout so it covers every page (home header sign-ins never
 * pass through AuthGate).
 *
 * EXTERNAL-ONLY effect: VIT emails return before doing anything (no fetch,
 * no sign-out, no modal) — the VIT student path is byte-identical with or
 * without this component. For non-VIT emails:
 * - external one-shot flag present → admit (fresh sign-ups, no row data yet);
 * - otherwise the user row decides: regNumber "N/A" means an onboarded
 *   external (admitted on every reload forever), anything else means a
 *   default-path non-VIT sign-in → sign out + reopen the popup.
 * Booking gates (details, paid/allowlist) remain the real admission control.
 */
export function VitEnforcement() {
  const { data: session, isPending } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const enforcingRef = useRef(false);

  useEffect(() => {
    const email = session?.user?.email;
    // VIT path: untouched, zero side effects.
    if (isPending || !email || isVitEmail(email) || enforcingRef.current) return;
    if (consumeExternalSignin()) return;
    // No flag: only an onboarded external (row stamped "N/A" by the locked
    // details modal, which only offers it to non-VIT emails) may stay.
    // Anything else is a default-path non-VIT sign-in → boot it out.
    // Fetch errors fail open: without the API nothing downstream works anyway.
    let cancelled = false;
    fetch(`${apiBaseUrl}/users/me/profile`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: { regNumber?: string | null } } | null) => {
        if (cancelled) return;
        if (json?.data?.regNumber === "N/A") return;
        enforcingRef.current = true;
        signOut().finally(() => {
          enforcingRef.current = false;
          setAuthOpen(true);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email, isPending]);

  return (
    <AuthModal
      isOpen={authOpen}
      onClose={() => setAuthOpen(false)}
      initialMode="signin"
    />
  );
}
