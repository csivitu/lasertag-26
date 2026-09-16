"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, LogOut, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { clearStaffRole, getStaffRole, type StaffRole } from "@/lib/auth";

export function Header() {
  const router = useRouter();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<StaffRole | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    const res = await apiFetch<any>("/");
    setApiOnline(res.success);
    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
    getStaffRole().then(setRole);
  }, []);

  const logout = async () => {
    await apiFetch("/admin-auth/logout", { method: "POST" });
    clearStaffRole();
    router.push("/login");
  };

  return (
    <header className="h-14 bg-[#141417] border-b border-[#27272A] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title / Breadcrumb Placeholder */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-[#71717A]">Workstation Console</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {role && (
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${
              role === "super_admin"
                ? "bg-violet-500/10 text-violet-400 border-violet-500/30"
                : "bg-sky-500/10 text-sky-400 border-sky-500/30"
            }`}
          >
            {role === "super_admin" ? "SUPER ADMIN" : "ADMIN"}
          </span>
        )}
        <button
          onClick={logout}
          title="Sign out"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#09090B] border border-[#27272A] text-xs font-mono text-[#A1A1AA] hover:text-rose-400 hover:border-rose-500/40 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
        {/* API Server Status Indicator */}
        <button
          onClick={checkStatus}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#09090B] border border-[#27272A] text-xs font-mono text-[#A1A1AA] hover:border-[#3F3F46] transition-colors"
        >
          <Activity className={`w-3.5 h-3.5 ${apiOnline ? "text-emerald-400" : "text-amber-500"}`} />
          <span>API: {apiOnline === null ? "Checking..." : apiOnline ? "Online" : "Offline"}</span>
          <RefreshCw className={`w-3 h-3 text-[#71717A] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </header>
  );
}
