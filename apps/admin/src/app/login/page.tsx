"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { clearStaffRole } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  // Read via window (not useSearchParams) so this page prerenders without a
  // Suspense boundary.
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    setUnavailable(new URLSearchParams(window.location.search).get("reason") === "unavailable");
  }, []);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await apiFetch("/admin-auth/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    if (!res.success) {
      setLoading(false);
      // 429 carries Retry-After; surface a human message instead of a raw error.
      setError(
        res.status === 429
          ? "Too many login attempts, wait a minute and try again."
          : (res.error || "Login failed"),
      );
      return;
    }
    // The login POST can return 200 while the browser dropped the session
    // cookie (Secure/Domain mismatch, proxy stripping Set-Cookie). Verify the
    // session actually persisted before navigating, or the middleware bounces
    // straight back to /login looking like a phantom success.
    const me = await apiFetch<{ user?: { role?: string } }>("/admin-auth/me");
    if (me.success) {
      clearStaffRole();
      // Keep loading=true through the navigation so the button stays on
      // "Signing in..." instead of flickering back to "Sign in".
      router.push("/");
      router.refresh();
    } else {
      setLoading(false);
      setError(
        me.status === 0
          ? "Login reached the server but the session check failed (API unreachable). Retry."
          : "Login succeeded but the session did not persist. Check cookies / try again.",
      );
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#09090B] p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-[#141417] border border-[#27272A] p-6 rounded-2xl">
        <h1 className="text-lg font-bold text-[#FAFAFA]">Staff Login</h1>
        {unavailable && (
          <p className="text-xs text-amber-400">API was unreachable. Check connection, then sign in again.</p>
        )}
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Staff password" autoFocus
            className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-2 pr-10 text-sm text-[#FAFAFA]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#71717A] hover:text-[#FAFAFA] transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button disabled={loading} className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm disabled:opacity-50">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
