"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useSession, signOut } from "@/lib/auth-client";
import { Radio, RefreshCw, LogOut, ShieldCheck, User } from "lucide-react";

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    const res = await apiFetch<Record<string, unknown>>("/");
    setApiOnline(res.success);
    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch("/admin-auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    await signOut();
    router.push("/login");
  };

  const userRole = (session?.user as { role?: string } | undefined)?.role;

  return (
    <header className="h-14 bg-[#141417] border-b border-[#27272A] px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Mission Control
        </span>
        <span className="text-zinc-600">/</span>
        <span className="text-xs text-zinc-300">HQ Console</span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* API Health Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#18181B] border border-[#27272A] text-xs font-mono">
          <Radio
            className={`w-3.5 h-3.5 ${
              apiOnline === true
                ? "text-emerald-400 animate-pulse"
                : apiOnline === false
                ? "text-red-400"
                : "text-zinc-500"
            }`}
          />
          <span className="text-zinc-400">API:</span>
          <span
            className={
              apiOnline === true
                ? "text-emerald-400 font-semibold"
                : apiOnline === false
                ? "text-red-400 font-semibold"
                : "text-zinc-500"
            }
          >
            {apiOnline === true
              ? "ONLINE"
              : apiOnline === false
              ? "OFFLINE"
              : "CHECKING..."}
          </span>
          <button
            onClick={checkStatus}
            disabled={loading}
            title="Refresh API status"
            className="ml-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <RefreshCw
              className={`w-3 h-3 ${loading ? "animate-spin text-zinc-300" : ""}`}
            />
          </button>
        </div>

        {/* Current Authenticated Admin Profile */}
        {session?.user && (
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#18181B] border border-[#27272A] text-xs">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Admin"}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-3 h-3" />
              )}
            </div>
            <span className="text-zinc-200 font-medium max-w-[120px] truncate">
              {session.user.name || session.user.email}
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-semibold uppercase border border-emerald-500/20">
              <ShieldCheck className="w-2.5 h-2.5" />
              {userRole || "ADMIN"}
            </span>
          </div>
        )}

        {/* Admin Session Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 hover:border-red-500/40 transition-colors px-2.5 py-1 rounded bg-[#18181B] border border-[#27272A]"
          title="Sign out of command session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
}
