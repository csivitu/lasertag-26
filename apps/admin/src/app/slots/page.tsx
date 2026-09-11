"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Clock, CalendarDays, RefreshCw, Layers, Filter, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

export default function SlotsPage() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter Date State
  const [filterDate, setFilterDate] = useState("");

  // Default date
  const defaultDateStr = "2026-12-18";

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
    const res = await apiFetch<any>("/slots");
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
    } else {
      setSlots([]);
    }
    setLoading(false);
  };

  useEffect(() => {
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
        let totalMins = hours * 60 + minutes + 30;
        let newHours = Math.floor(totalMins / 60) % 24;
        let newMins = totalMins % 60;
        const formatted = `${String(newHours).padStart(2, "0")}:${String(newMins).padStart(2, "0")}`;
        setSingleEndTime(formatted);
      }
    }
  };

  // Helper to build clean UTC ISO string YYYY-MM-DDTHH:mm:ss.000Z
  const makeUtcIso = (dateStr: string, timeStr: string) => {
    return `${dateStr}T${timeStr}:00.000Z`;
  };

  // Count slots for a specific date (for 100/day limit check)
  const getSlotCountForDate = (dateStr: string) => {
    return slots.filter((s) => {
      if (!s.startTime) return false;
      const d = new Date(s.startTime).toISOString().slice(0, 10);
      return d === dateStr;
    }).length;
  };

  // Calculate generated bulk intervals
  const getBulkSlotsPreview = () => {
    if (!bulkDate || !bulkStartTime || !bulkEndTime) return [];
    const startObj = new Date(makeUtcIso(bulkDate, bulkStartTime));
    const endObj = new Date(makeUtcIso(bulkDate, bulkEndTime));

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
    if (!singleDate || !singleStartTime || !singleEndTime) {
      setError("Please select date, start time, and end time.");
      return;
    }

    const currentCount = getSlotCountForDate(singleDate);
    if (currentCount >= 100) {
      setError(`Limit Reached: ${singleDate} already has ${currentCount} slots (Max 100 slots/day).`);
      return;
    }

    const startIso = makeUtcIso(singleDate, singleStartTime);
    const endIso = makeUtcIso(singleDate, singleEndTime);

    setSubmittingSingle(true);
    setError(null);
    setSuccess(null);

    const res = await apiFetch<any>("/slots", {
      method: "POST",
      body: JSON.stringify({
        startTime: startIso,
        endTime: endIso,
        capacity: 10,
      }),
    });

    if (res.success) {
      setSuccess("Single Slot created successfully.");
      fetchSlots();
    } else {
      setError(res.error || "Failed to create slot.");
    }
    setSubmittingSingle(false);
  };

  const handleCreateBulkSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    const previewSlots = getBulkSlotsPreview();
    if (previewSlots.length === 0) {
      setError("Please specify a valid start and end time window.");
      return;
    }

    const currentCount = getSlotCountForDate(bulkDate);
    if (currentCount + previewSlots.length > 100) {
      setError(`Daily Cap Error: Adding ${previewSlots.length} slots exceeds max limit of 100 slots/day (Current: ${currentCount}).`);
      return;
    }

    setSubmittingBulk(true);
    setError(null);
    setSuccess(null);

    let successCount = 0;
    let failCount = 0;

    for (const slotItem of previewSlots) {
      const res = await apiFetch<any>("/slots", {
        method: "POST",
        body: JSON.stringify({
          startTime: slotItem.start.toISOString(),
          endTime: slotItem.end.toISOString(),
          capacity: 10,
        }),
      });

      if (res.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    if (successCount > 0) {
      setSuccess(`Successfully generated ${successCount} slots of ${slotDurationMins} mins each.`);
      fetchSlots();
    }
    if (failCount > 0) {
      setError(`Failed to create ${failCount} slots.`);
    }

    setSubmittingBulk(false);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;

    const res = await apiFetch<any>(`/slots/${slotId}`, {
      method: "DELETE",
    });

    if (res.success) {
      setSuccess("Slot deleted successfully.");
      fetchSlots();
    } else {
      setError(res.error || "Failed to delete slot.");
    }
  };

  const slotList = Array.isArray(slots) ? slots : [];
  const bulkPreview = getBulkSlotsPreview();

  // Extract unique dates
  const uniqueDates = Array.from(
    new Set(
      slotList
        .map((s) => (s.startTime ? new Date(s.startTime).toISOString().slice(0, 10) : null))
        .filter((d): d is string => d !== null)
    )
  ).sort();

  // Filtered slots
  const filteredSlots = slotList.filter((s) => {
    if (!filterDate) return true;
    if (!s.startTime) return false;
    const slotDateStr = new Date(s.startTime).toISOString().slice(0, 10);
    return slotDateStr === filterDate;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#FAFAFA] tracking-tight">Slot Manager Workstation</h1>
          <p className="text-xs text-[#71717A] mt-0.5">
            Configure individual slots or batch generate 15, 20, 25, or 30-min windows (Max 100 slots/day)
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
        {/* Creation Workstations Column (Single + Bulk) */}
        <div className="space-y-6">
          {/* 1. SINGLE SLOT CREATION CARD */}
          <div className="bg-[#141417] border border-[#27272A] p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#27272A] pb-3">
              <Plus className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-[#FAFAFA] tracking-tight uppercase font-mono">
                Create Single Slot
              </h2>
            </div>

            <form onSubmit={handleCreateSingleSlot} className="space-y-3">
              {/* Event Date Presets */}
              <div>
                <label className="block text-[11px] text-[#A1A1AA] mb-1 font-medium flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3 text-emerald-400" /> Event Date Presets
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[
                    { label: "18 Dec", val: "2026-12-18" },
                    { label: "19 Dec", val: "2026-12-19" },
                    { label: "20 Dec", val: "2026-12-20" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setSingleDate(p.val)}
                      className={`py-1 rounded-lg text-xs font-mono border transition-all ${
                        singleDate === p.val
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                          : "bg-[#09090B] text-[#71717A] border-[#27272A] hover:text-[#FAFAFA]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46] [color-scheme:dark] cursor-pointer"
                  required
                />
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
              {/* Event Date Presets */}
              <div>
                <label className="block text-[11px] text-[#A1A1AA] mb-1 font-medium flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3 text-emerald-400" /> Event Date Presets
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[
                    { label: "18 Dec", val: "2026-12-18" },
                    { label: "19 Dec", val: "2026-12-19" },
                    { label: "20 Dec", val: "2026-12-20" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setBulkDate(p.val)}
                      className={`py-1 rounded-lg text-xs font-mono border transition-all ${
                        bulkDate === p.val
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                          : "bg-[#09090B] text-[#71717A] border-[#27272A] hover:text-[#FAFAFA]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46] [color-scheme:dark] cursor-pointer"
                  required
                />
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
                          {item.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} - {item.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
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
            </form>
          </div>
        </div>

        {/* Existing Slots List with Date Filter Bar */}
        <div className="lg:col-span-2 space-y-3">
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
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-[#09090B] border border-[#27272A] rounded-xl px-2.5 py-1 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#3F3F46] [color-scheme:dark] cursor-pointer"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="text-[11px] text-amber-400 hover:underline px-1"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Quick Date Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setFilterDate("")}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  !filterDate
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold"
                    : "bg-[#09090B] text-[#71717A] border border-[#27272A] hover:text-[#FAFAFA]"
                }`}
              >
                All
              </button>

              {uniqueDates.map((dateStr) => {
                const isSelected = filterDate === dateStr;
                const formattedLabel = new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
                  month: "numeric",
                  day: "numeric",
                  timeZone: "UTC",
                });

                return (
                  <button
                    key={dateStr}
                    onClick={() => setFilterDate(dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
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
                      timeZone: "UTC",
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "N/A";

                const endFormatted = slot.endTime
                  ? new Date(slot.endTime).toLocaleTimeString("en-US", {
                      timeZone: "UTC",
                      timeStyle: "short",
                    })
                  : "N/A";

                return (
                  <div
                    key={slot.id || idx}
                    className="p-4 bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] rounded-2xl flex items-center justify-between transition-all"
                  >
                    <div className="space-y-1">
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

                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="p-2 text-[#71717A] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                      title="Delete Slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
