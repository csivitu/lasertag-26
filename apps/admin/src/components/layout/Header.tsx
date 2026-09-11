"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export function Header() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    const res = await apiFetch<any>("/");
    setApiOnline(res.success);
    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <header className="h-14 bg-[#141417] border-b border-[#27272A] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Title / Breadcrumb Placeholder */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-[#71717A]">Workstation Console</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
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
