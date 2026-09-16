"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { Shield, KeyRound, AlertCircle, Loader2, Eye, EyeOff, Lock, Mail } from "lucide-react";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError === "unauthorized"
      ? "Your account does not possess Commander / Admin authorization."
      : null
  );

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please provide both command email and security key.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<{ success: boolean; user?: { id: string; name: string; role: string } }>(
        "/admin-auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        }
      );

      if (res.success) {
        // Successfully authenticated as admin
        router.push("/analytics");
        router.refresh();
      } else {
        setError(res.error || "Authentication failed. Invalid email or security password.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reach command authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#121217] border border-[#27272A] rounded-2xl p-8 shadow-2xl">
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <Shield className="w-7 h-7" />
        </div>
        <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-2">
          Restricted Command Terminal
        </span>
        <h1 className="text-xl font-bold tracking-wider text-zinc-100 uppercase">
          LaserTag HQ Admin
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Enter verified commander credentials to access mission control.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePasswordLogin} className="space-y-4">
        <div>
          <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1.5 font-mono">
            Commander Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sujalmishra.0306@gmail.com"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 font-mono">
              Security Key / Password
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#18181B] border border-[#27272A] rounded-xl pl-9 pr-10 py-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs tracking-wider uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] disabled:opacity-50 font-mono"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              Authenticating Credentials...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Establish Admin Session
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-[#222228] text-center">
        <p className="text-[11px] text-zinc-500 font-mono">
          LaserTag '26 Command & Logistics Workstation
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md bg-[#121217] border border-[#27272A] rounded-2xl p-8 shadow-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
