"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, LogOut, Menu, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { clearStaffRole, getStaffRole, type StaffRole } from "@/lib/auth";
import { toggleAdminSidebar } from "./Sidebar";

export function Header() {
  const router = useRouter();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<StaffRole | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    const res = await apiFetch<unknown>("/");
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
    <header className="h-14 bg-[#141417] border-b border-[#27272A] px-4 sm:px-6 flex items-center justify-between gap-2 sticky top-0 z-20">
      {/* Title / Breadcrumb Placeholder */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleAdminSidebar}
          aria-label="Toggle menu"
          className="lg:hidden p-1.5 -ml-1 rounded-lg text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="hidden sm:block text-xs font-mono text-[#71717A] truncate">Workstation Console</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
          className="hidden min-[420px]:flex items-center gap-2 px-3 py-1 rounded-full bg-[#09090B] border border-[#27272A] text-xs font-mono text-[#A1A1AA] hover:border-[#3F3F46] transition-colors"
        >
          <Activity className={`w-3.5 h-3.5 ${apiOnline ? "text-emerald-400" : "text-amber-500"}`} />
          <span className="hidden md:inline">API: {apiOnline === null ? "Checking..." : apiOnline ? "Online" : "Offline"}</span>
          <RefreshCw className={`w-3 h-3 text-[#71717A] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </header>
  );
}
