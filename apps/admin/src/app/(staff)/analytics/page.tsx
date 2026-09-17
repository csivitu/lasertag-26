"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  TrendingUp,
  CalendarDays,
  QrCode,
  Clock,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { getStaffRole } from "@/lib/auth";

interface SlotSummary {
  id: string;
  startTime?: string;
}

export default function AnalyticsPage() {
  const [slots, setSlots] = useState<SlotSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const res = await apiFetch<SlotSummary[] | { slots: SlotSummary[] }>("/slots");
    if (res.success && res.data) {
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.slots)
        ? res.data.slots
        : [];
      setSlots(list);
    } else {
      setError(res.error || "Failed to load slots data");
      setSlots([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    getStaffRole().then((r) => setIsSuperAdmin(r === "super_admin"));
  }, []);

  const slotList = Array.isArray(slots) ? slots : [];
  const totalSlots = slotList.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#FAFAFA] tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Real-time event slot allocation and venue check-in statistics
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#141417] border border-[#27272A] rounded-xl text-xs text-[#FAFAFA] hover:border-[#3F3F46] transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Stats</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-mono">
          {error}
        </div>
      )}

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Stat Card 1: Configured Slots */}
        <div className="bg-[#141417] border border-[#27272A] p-5 rounded-2xl space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A1A1AA] font-medium">Configured Game Slots</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3" /> Active
            </span>
          </div>
          <div className="text-3xl font-bold text-[#FAFAFA] font-mono tracking-tight">
            {loading ? "..." : totalSlots}
          </div>
        </div>

        {/* Stat Card 2: Check-In Station Status */}
        <div className="bg-[#141417] border border-[#27272A] p-5 rounded-2xl space-y-3 relative">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A1A1AA] font-medium">Check-In Station</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              Ready
            </span>
          </div>
          <div className="text-3xl font-bold text-[#FAFAFA] font-mono tracking-tight">
            Online
          </div>
        </div>
      </div>

      {/* Main Content Grid: Quick Actions + Active Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Station Workstations */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-[#FAFAFA] tracking-tight">Quick Workstations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isSuperAdmin && (
              <Link
                href="/slots"
                className="p-5 bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] rounded-2xl space-y-2 group transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-[#09090B] border border-[#27272A] flex items-center justify-center text-emerald-400 group-hover:border-[#3F3F46]">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#FAFAFA]">Slot Manager</h3>
                <p className="text-xs text-[#71717A]">Create 30-min single slots or batch generate time windows</p>
              </Link>
            )}

            <Link
              href="/checkin"
              className="p-5 bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] rounded-2xl space-y-2 group transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-[#09090B] border border-[#27272A] flex items-center justify-center text-emerald-400 group-hover:border-[#3F3F46]">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#FAFAFA]">Check-In Station</h3>
              <p className="text-xs text-[#71717A]">Scan participant QR codes or search by registration ID</p>
            </Link>
          </div>
        </div>

        {/* Right Column: Active Game Slots List */}
        <div className="space-y-4">
          <div className="bg-[#141417] border border-[#27272A] p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-semibold text-[#FAFAFA] tracking-tight">Active Game Slots</h3>
            {slotList.length === 0 ? (
              <p className="text-xs text-[#71717A]">No time slots created yet.</p>
            ) : (
              <div className="space-y-2">
                {slotList.map((slot, idx) => (
                  <div key={slot.id || idx} className="p-3 bg-[#09090B] border border-[#27272A] rounded-xl flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#27272A] text-emerald-400">
                      Slot {idx + 1}
                    </span>
                    <span className="text-[#A1A1AA] font-mono flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[#71717A]" />
                      {slot.startTime ? new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
