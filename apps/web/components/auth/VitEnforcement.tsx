"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { consumeExternalSignin, isVitEmail } from "@/lib/vit";
import { AuthModal } from "./AuthModal";

/**
 * Global VIT-domain enforcement for the default sign-in path. Mounted once
 * in the root layout so it covers every page (home header sign-ins never
 * pass through AuthGate).
 *
 * External entries consume a one-shot flag and skip the check; anything else
 * arriving on a non-VIT email is signed straight back out and the sign-in
 * popup reopens with a notice. Booking gates (details, paid/allowlist)
 * remain the real admission control.
 */
export function VitEnforcement() {
  const { data: session, isPending } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const enforcingRef = useRef(false);

  useEffect(() => {
    const email = session?.user?.email;
    if (isPending || !email || enforcingRef.current) return;
    if (consumeExternalSignin()) return;
    if (!isVitEmail(email)) {
      enforcingRef.current = true;
      signOut().finally(() => {
        enforcingRef.current = false;
        setAuthOpen(true);
      });
    }
  }, [session?.user?.email, isPending]);

  return (
    <AuthModal
      isOpen={authOpen}
      onClose={() => setAuthOpen(false)}
      initialMode="signin"
    />
  );
}
