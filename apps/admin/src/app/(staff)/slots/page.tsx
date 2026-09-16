"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, CalendarDays, RefreshCw, Layers, Filter, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { getStaffRole, type StaffRole } from "@/lib/auth";

interface SlotItem {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

const EVENT_DATES = [
  { label: "18th Sep", val: "2026-09-18" },
  { label: "19th Sep", val: "2026-09-19" },
  { label: "20th Sep", val: "2026-09-20" },
];

export default function SlotsPage() {
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter Date State
  const [filterDate, setFilterDate] = useState("");
  const [role, setRole] = useState<StaffRole | null>(null);
  const canManageSlots = role === "super_admin";
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);

  // Default date
  const defaultDateStr = "2026-09-18";

  // Single Slot Form State
  const [singleDate, setSingleDate] = useState(defaultDateStr);
  const [singleStartTime, setSingleStartTime] = useState("14:00");
  const [singleEndTime, setSingleEndTime] = useState("14:30");

  // Bulk Slots Form State
  const [bulkDate, setBulkDate] = useState(defaultDateStr);
  const [bulkStartTime, setBulkStartTime] = useState("14:00");
  const [bulkEndTime, setBulkEndTime] = useState("18:00");
  const [slotDurationMins, setSlotDurationMins] = useState(30);

  const fetchSlots = async () => {
    setLoading(true);
    const res = await apiFetch<SlotItem[] | { slots: SlotItem[] }>("/admin/slots");
    if (res.success && res.data) {
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.slots)
        ? res.data.slots
        : [];

      // Sort slots chronologically
      const sorted = [...list].sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeA - timeB;
      });

      setSlots(sorted);
      // Drop selections for slots that no longer exist.
      setSelected((prev) => new Set([...prev].filter((id) => sorted.some((s) => s.id === id))));
    } else {
      setSlots([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    getStaffRole().then(setRole);
    fetchSlots();
    const interval = setInterval(() => {
      fetchSlots();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-set single end time when start time or duration changes
  const handleSingleStartTimeChange = (timeStr: string) => {
    setSingleStartTime(timeStr);
    if (timeStr) {
      const parts = timeStr.split(":");
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const totalMins = hours * 60 + minutes + 30;
        const newHours = Math.floor(totalMins / 60) % 24;
        const newMins = totalMins % 60;
        const formatted = `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
        setSingleEndTime(formatted);
      }
    }
  };

  // Arena wall-clock is IST. Inputs are IST wall time; storage is UTC.
  // IST is UTC+5:30 with no DST, so this offset is exact.
  // (The old helper suffixed Z onto IST wall time, storing 10:00 IST as
  // 10:00 UTC — which every IST display then showed as 3:30 PM.)
  const ARENA_TIME_ZONE = "Asia/Kolkata";
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

  const istToUtcIso = (dateStr: string, timeStr: string) => {
    const [y, mo, d] = dateStr.split("-").map(Number);
    const [h, mi] = timeStr.split(":").map(Number);
    return new Date(Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET_MS).toISOString();
  };

  const istDateKey = (iso: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ARENA_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(iso));

  // Count slots for a specific date (for 100/day limit check)
  const getSlotCountForDate = (dateStr: string) => {
    return slots.filter((s) => {
      if (!s.startTime) return false;
      return istDateKey(s.startTime) === dateStr;
    }).length;
  };

  // Calculate generated bulk intervals
  const getBulkSlotsPreview = () => {
    if (!bulkDate || !bulkStartTime || !bulkEndTime) return [];
    const startObj = new Date(istToUtcIso(bulkDate, bulkStartTime));
    const endObj = new Date(istToUtcIso(bulkDate, bulkEndTime));

    const startMs = startObj.getTime();
    const endMs = endObj.getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return [];

    const durationMs = slotDurationMins * 60 * 1000;
    const generated: { start: Date; end: Date }[] = [];

    let current = startMs;
    while (current + durationMs <= endMs) {
      generated.push({
        start: new Date(current),
        end: new Date(current + durationMs),
      });
      current += durationMs;
    }

    return generated;
  };

  const handleCreateSingleSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!singleDate || !singleStartTime || !singleEndTime) {
      setError("Please select a date, start time, and end time.");
      return;
    }

    // 100 slots per day maximum limit check
    const currentCount = getSlotCountForDate(singleDate);
    if (currentCount >= 100) {
      setError(`Daily limit reached: Maximum 100 slots allowed per day for ${singleDate}.`);
      return;
    }

    const startTimeUtc = istToUtcIso(singleDate, singleStartTime);
    const endTimeUtc = istToUtcIso(singleDate, singleEndTime);

    const startObj = new Date(startTimeUtc);
    const endObj = new Date(endTimeUtc);

    if (endObj.getTime() <= startObj.getTime()) {
      setError("End time must be after start time.");
      return;
    }

    setSubmittingSingle(true);

    const res = await apiFetch<SlotItem>("/admin/slots", {
      method: "POST",
      body: JSON.stringify({
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        capacity: 10,
      }),
    });

    if (res.success) {
      setSuccess("Slot created successfully.");
      fetchSlots();
    } else {
      setError(res.error || "Failed to create slot.");
    }

    setSubmittingSingle(false);
  };

  const handleCreateBulkSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const generated = getBulkSlotsPreview();
    if (generated.length === 0) {
      setError("No valid slot intervals generated. Please check your start and end window.");
      return;
    }

    // Daily limit check
    const currentCount = getSlotCountForDate(bulkDate);
    if (currentCount + generated.length > 100) {
      setError(
        `Cannot create ${generated.length} slots. Date ${bulkDate} already has ${currentCount} slots (Max 100 allowed/day).`
      );
      return;
    }

    setSubmittingBulk(true);

    const slotPayloads = generated.map((item) => ({
      startTime: item.start.toISOString(),
      endTime: item.end.toISOString(),
      capacity: 10,
    }));

    // Batch endpoint expects a raw JSON array (see bulkCreateSlotsSchema).
    const res = await apiFetch<{ count?: number }>("/admin/slots/bulk", {
      method: "POST",
      body: JSON.stringify(slotPayloads),
    });

    if (res.success) {
      setSuccess(`Successfully generated ${generated.length} slots for ${bulkDate}!`);
      fetchSlots();
      setSubmittingBulk(false);
      return;
    }

    // Fallback: sequential single slot creation
    let successCount = 0;
    let failCount = 0;

    for (const item of slotPayloads) {
      const singleRes = await apiFetch<SlotItem>("/admin/slots", {
        method: "POST",
        body: JSON.stringify(item),
      });

      if (singleRes.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    fetchSlots();

    if (successCount > 0) {
      setSuccess(`Successfully generated ${successCount} slots.`);
    }
    if (failCount > 0) {
      setError(`Failed to create ${failCount} slots.`);
    }

    setSubmittingBulk(false);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;

    const res = await apiFetch<{ message?: string }>(`/admin/slots/${slotId}`, {
      method: "DELETE",
    });

    if (res.success) {
      setSuccess("Slot deleted successfully.");
      fetchSlots();
    } else {
      setError(res.error || "Failed to delete slot.");
    }
  };

  const toggleSelect = (slotId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredSlots.length) setSelected(new Set());
    else setSelected(new Set(filteredSlots.map((s) => s.id)));
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected slot(s)? Slots with bookings cannot be deleted.`)) return;
    setDeletingSelected(true);
    setError(null);
    setSuccess(null);
    let ok = 0;
    let fail = 0;
    for (const id of selected) {
      const res = await apiFetch(`/admin/slots/${id}`, { method: "DELETE" });
      if (res.success) ok++;
      else fail++;
    }
    setSelected(new Set());
    fetchSlots();
    if (ok > 0) setSuccess(`Deleted ${ok} slot(s).`);
    if (fail > 0) setError(`Failed to delete ${fail} slot(s) — they may have bookings.`);
    setDeletingSelected(false);
  };

  const slotList = Array.isArray(slots) ? slots : [];
  const bulkPreview = getBulkSlotsPreview();

  // Extract unique dates (IST calendar days)
  const uniqueDates = Array.from(
    new Set(
      slotList
        .map((s) => (s.startTime ? istDateKey(s.startTime) : null))
        .filter((d): d is string => d !== null)
    )
  ).sort();

  // Filtered slots
  const filteredSlots = slotList.filter((s) => {
    if (!filterDate) return true;
    if (!s.startTime) return false;
    return istDateKey(s.startTime) === filterDate;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#FAFAFA] tracking-tight">Slot Manager Workstation</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Configure individual slots or batch generate 10, 15, 20, 25, or 30-min windows (Max 100 slots/day)
          </p>
        </div>
        <button
          onClick={fetchSlots}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#141417] border border-[#27272A] rounded-xl text-xs text-[#FAFAFA] hover:border-[#3F3F46] transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
          <span>Reload</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono">
          {success}
        </div>
      )}

      {/* Grid Layout: Forms Column + Existing Slots List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Workstations Column (Single + Bulk) — super_admin only.
            Always rendered but disabled for plain admins so the restriction
            is visible instead of looking broken. Backend 403s enforce it. */}
        <div className={`space-y-6 ${role !== null && !canManageSlots ? "opacity-60" : ""}`}>
          {!canManageSlots && role !== null && (
            <div className="p-3 bg-sky-500/10 border border-sky-500/30 text-sky-400 rounded-xl text-xs font-mono">
              Slot creation is super-admin only. You are signed in as admin.
            </div>
          )}
          {/* 1. SINGLE SLOT CREATION CARD */}
          <div className="bg-[#141417] border border-[#27272A] p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#27272A] pb-3">
              <Plus className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-[#FAFAFA] tracking-tight uppercase font-mono">
                Create Single Slot
              </h2>
            </div>

            <form onSubmit={handleCreateSingleSlot} className="space-y-3">
              <fieldset disabled={!canManageSlots} className="space-y-3">
              {/* Event Date Buttons */}
              <div>
                <label className="block text-[11px] text-[#A1A1AA] mb-1.5 font-medium flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-400" /> Event Date (Sep 2026)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {EVENT_DATES.map((p) => {
                    const isSelected = singleDate === p.val;
                    return (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setSingleDate(p.val)}
                        className={`py-2 rounded-xl text-xs font-mono border transition-all text-center ${
                          isSelected
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold shadow-sm"
                            : "bg-[#09090B] text-[#71717A] border-[#27272A] hover:text-[#FAFAFA] hover:border-[#3F3F46]"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clock Timer Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" /> Start Time
                  </label>
                  <input
                    type="time"
                    value={singleStartTime}
                    onChange={(e) => handleSingleStartTimeChange(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46] [color-scheme:dark] cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" /> End Time
                  </label>
                  <input
                    type="time"
                    value={singleEndTime}
                    onChange={(e) => setSingleEndTime(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46] [color-scheme:dark] cursor-pointer"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingSingle}
                className="w-full py-2 bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] font-semibold rounded-xl transition-all border border-[#3F3F46] text-xs disabled:opacity-50 mt-1"
              >
                {submittingSingle ? "Creating..." : "Create Slot"}
              </button>
              </fieldset>
            </form>
          </div>

          {/* 2. BULK SLOT GENERATOR CARD */}
          <div className="bg-[#141417] border border-[#27272A] p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#27272A] pb-3">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-[#FAFAFA] tracking-tight uppercase font-mono">
                Bulk Slot Generator
              </h2>
            </div>

            <form onSubmit={handleCreateBulkSlots} className="space-y-3">
              <fieldset disabled={!canManageSlots} className="space-y-3">
              {/* Event Date Buttons */}
              <div>
                <label className="block text-[11px] text-[#A1A1AA] mb-1.5 font-medium flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-400" /> Event Date (Sep 2026)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {EVENT_DATES.map((p) => {
                    const isSelected = bulkDate === p.val;
                    return (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setBulkDate(p.val)}
                        className={`py-2 rounded-xl text-xs font-mono border transition-all text-center ${
                          isSelected
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold shadow-sm"
                            : "bg-[#09090B] text-[#71717A] border-[#27272A] hover:text-[#FAFAFA] hover:border-[#3F3F46]"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Window Start & End Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" /> Window Start
                  </label>
                  <input
                    type="time"
                    value={bulkStartTime}
                    onChange={(e) => setBulkStartTime(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46] [color-scheme:dark] cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A1A1AA] mb-1 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" /> Window End
                  </label>
                  <input
                    type="time"
                    value={bulkEndTime}
                    onChange={(e) => setBulkEndTime(e.target.value)}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46] [color-scheme:dark] cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Slot Duration Dropdown */}
              <div>
                <label className="block text-[11px] text-[#A1A1AA] mb-1 font-medium">Interval Duration</label>
                <select
                  value={slotDurationMins}
                  onChange={(e) => setSlotDurationMins(Number(e.target.value))}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] font-mono focus:outline-none focus:border-[#3F3F46]"
                >
                  <option value={10}>10 Minutes Each</option>
                  <option value={15}>15 Minutes Each</option>
                  <option value={20}>20 Minutes Each</option>
                  <option value={25}>25 Minutes Each</option>
                  <option value={30}>30 Minutes Each</option>
                </select>
              </div>

              {/* Bulk Generation Preview Box */}
              {bulkPreview.length > 0 && (
                <div className="p-3 bg-[#09090B] border border-[#27272A] rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                    <span>Generated Slots:</span>
                    <span className="font-bold">{bulkPreview.length} Slots</span>
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-[11px] font-mono text-[#71717A]">
                    {bulkPreview.map((item, idx) => (
                      <div key={idx} className="flex justify-between border-b border-[#27272A] pb-1">
                        <span>Slot {idx + 1}:</span>
                        <span className="text-[#FAFAFA]">
                          {item.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })} - {item.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingBulk || bulkPreview.length === 0}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all shadow-sm text-xs disabled:opacity-50"
              >
                {submittingBulk ? "Generating Slots..." : `Generate (${bulkPreview.length}) Slots`}
              </button>
              </fieldset>
            </form>
          </div>
        </div>

        {/* Existing Slots List with Date Filter Bar */}
        <div className={`${canManageSlots ? "lg:col-span-2" : "lg:col-span-3"} space-y-3`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#FAFAFA] tracking-tight">
              Configured Game Slots
            </h2>
            <span className="text-xs font-mono text-[#71717A]">
              Showing {filteredSlots.length} of {slotList.length} Total
            </span>
          </div>

          {/* Date Filter Bar */}
          <div className="bg-[#141417] border border-[#27272A] p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="text-xs text-[#A1A1AA] font-medium">Filter by Date:</span>
            </div>

            {/* Quick Date Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setFilterDate("")}
                className={`px-3 py-1 rounded-xl text-xs font-mono transition-all ${
                  !filterDate
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold"
                    : "bg-[#09090B] text-[#71717A] border border-[#27272A] hover:text-[#FAFAFA]"
                }`}
              >
                All
              </button>

              {EVENT_DATES.map((d) => {
                const isSelected = filterDate === d.val;
                return (
                  <button
                    key={d.val}
                    onClick={() => setFilterDate(d.val)}
                    className={`px-3 py-1 rounded-xl text-xs font-mono transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold"
                        : "bg-[#09090B] text-[#71717A] border border-[#27272A] hover:text-[#FAFAFA]"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}

              {uniqueDates
                .filter((dateStr) => !EVENT_DATES.some((ed) => ed.val === dateStr))
                .map((dateStr) => {
                  const isSelected = filterDate === dateStr;
                  const formattedLabel = new Date(`${dateStr}T00:00:00+05:30`).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: "Asia/Kolkata",
                  });

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setFilterDate(dateStr)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono transition-all ${
                        isSelected
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold"
                          : "bg-[#09090B] text-[#71717A] border border-[#27272A] hover:text-[#FAFAFA]"
                      }`}
                    >
                      {formattedLabel}
                    </button>
                  );
                })}
            </div>
          </div>

          {canManageSlots && !loading && filteredSlots.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-[#141417] border border-[#27272A] rounded-2xl text-xs">
              <label className="flex items-center gap-2 text-[#A1A1AA] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selected.size === filteredSlots.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
                Select all ({filteredSlots.length})
              </label>
              {selected.size > 0 && (
                <>
                  <span className="font-mono text-emerald-400">{selected.size} selected</span>
                  <button onClick={() => setSelected(new Set())} className="text-[#71717A] hover:text-[#FAFAFA] transition-colors">
                    Clear
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={deletingSelected}
                    className="ml-auto px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    {deletingSelected ? "Deleting..." : `Delete selected (${selected.size})`}
                  </button>
                </>
              )}
            </div>
          )}

          {loading ? (
            <p className="text-[#71717A] text-xs">Loading slots...</p>
          ) : filteredSlots.length === 0 ? (
            <div className="p-8 bg-[#141417] border border-[#27272A] rounded-2xl text-center text-[#71717A] text-xs space-y-1">
              <p>No time slots match the selected date filter.</p>
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="text-emerald-400 hover:underline text-xs"
                >
                  Show all slots
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredSlots.map((slot, idx) => {
                const startFormatted = slot.startTime
                  ? new Date(slot.startTime).toLocaleString("en-US", {
                      timeZone: "Asia/Kolkata",
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "N/A";

                const endFormatted = slot.endTime
                  ? new Date(slot.endTime).toLocaleTimeString("en-US", {
                      timeZone: "Asia/Kolkata",
                      timeStyle: "short",
                    })
                  : "N/A";

                return (
                  <div
                    key={slot.id || idx}
                    className="p-4 bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] rounded-2xl flex items-center justify-between gap-3 transition-all"
                  >
                    {canManageSlots && (
                      <input
                        type="checkbox"
                        checked={selected.has(slot.id)}
                        onChange={() => toggleSelect(slot.id)}
                        aria-label="Select slot"
                        className="w-4 h-4 shrink-0 accent-emerald-500 cursor-pointer"
                      />
                    )}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-[#09090B] border border-[#27272A] text-xs font-mono text-emerald-400 rounded-md font-semibold">
                          Slot {idx + 1}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#FAFAFA] flex items-center gap-2 mt-1">
                        <Clock className="w-3.5 h-3.5 text-[#A1A1AA]" />
                        {startFormatted} - {endFormatted}
                      </p>
                    </div>

                    {canManageSlots && (
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-2 text-[#71717A] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        title="Delete Slot (super admin only)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
