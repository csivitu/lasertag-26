"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Clock,
  CalendarDays,
  RefreshCw,
  Layers,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Users,
  X,
  Loader2,
  UserCheck,
} from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { getStaffRole, type StaffRole } from "@/lib/auth";
import { usePoll } from "@/lib/use-poll";

const PAGE_SIZE = 10;

interface SlotItem {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  totalCapacity?: number;
  bookedCount?: number;
  isHidden?: boolean;
}

interface SlotBookingUser {
  id: string;
  name: string;
  email: string;
  regNumber: string | null;
  phNumber: string | null;
}

interface SlotBookingItem {
  bookingId: string;
  type: "individual" | "team";
  status: "reserved" | "confirmed" | "cancelled";
  teamCode: string | null;
  confirmedAt: string | null;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  user: SlotBookingUser;
}

interface SlotBookingsResponse {
  slot: SlotItem;
  bookings: SlotBookingItem[];
}


const EVENT_DATES = [
  { label: "18th Sep", val: "2026-09-18" },
  { label: "19th Sep", val: "2026-09-19" },
  { label: "20th Sep", val: "2026-09-20" },
];

// Module-scope formatters: constructing Intl.DateTimeFormat per row per
// render was a measurable cost on every poll re-render.
const ARENA_TIME_ZONE = "Asia/Kolkata";
const istDateKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: ARENA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const istDateTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ARENA_TIME_ZONE,
  dateStyle: "short",
  timeStyle: "short",
});
const istTimeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ARENA_TIME_ZONE,
  timeStyle: "short",
});

export default function SlotsPage() {
  const router = useRouter();
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
  const [page, setPage] = useState(1);

  // Default date
  const defaultDateStr = "2026-09-18";

  // Single Slot Form State
  const [singleDate, setSingleDate] = useState(defaultDateStr);
  const [singleStartTime, setSingleStartTime] = useState("14:00");
  const [singleEndTime, setSingleEndTime] = useState("14:30");
  const [singleIsHidden, setSingleIsHidden] = useState(false);

  // Bulk Slots Form State
  const [bulkDate, setBulkDate] = useState(defaultDateStr);
  const [bulkStartTime, setBulkStartTime] = useState("14:00");
  const [bulkEndTime, setBulkEndTime] = useState("18:00");
  const [slotDurationMins, setSlotDurationMins] = useState(30);
  const [bulkIsHidden, setBulkIsHidden] = useState(false);

  // Booked Players Modal State
  const [activeSlotModal, setActiveSlotModal] = useState<SlotItem | null>(null);
  const [slotBookings, setSlotBookings] = useState<SlotBookingItem[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  const handleOpenSlotBookings = async (slot: SlotItem) => {
    setActiveSlotModal(slot);
    setSlotBookings([]);
    setBookingsError(null);
    setLoadingBookings(true);

    const res = await apiFetch<SlotBookingsResponse>(`/admin/slots/${slot.id}/bookings`);
    if (res.success && res.data) {
      setSlotBookings(res.data.bookings || []);
    } else {
      setBookingsError(res.error || "Failed to load bookings for this slot.");
    }
    setLoadingBookings(false);
  };

  const handleCloseSlotBookings = () => {
    setActiveSlotModal(null);
    setSlotBookings([]);
    setBookingsError(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeSlotModal) {
        handleCloseSlotBookings();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlotModal]);

  const fetchSlots = async (signal?: AbortSignal, silent = false) => {
    if (!silent) setLoading(true);
    const res = await apiFetch<SlotItem[] | { slots: SlotItem[] }>("/admin/slots", {
      ...(signal ? { signal } : {}),
    });
    // Aborted poll — leave existing state untouched.
    if (signal?.aborted) return;
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
    if (!silent) setLoading(false);
  };

  // Background poll: silent, visible-tab only, aborted on unmount/overlap.
  // Skipped while a mutation is in flight; mutations refetch explicitly.
  const { refreshing, refreshNow } = usePoll(
    (signal) => fetchSlots(signal, true),
    { paused: submittingSingle || submittingBulk || deletingSelected },
  );

  useEffect(() => {
    getStaffRole().then((r) => {
      setRole(r);
      // Plain admins have no slot-manager access — bounce to check-in.
      if (r !== null && r !== "super_admin") router.replace("/checkin");
    });
    void fetchSlots();
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
  const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

  const istToUtcIso = (dateStr: string, timeStr: string) => {
    const [y, mo, d] = dateStr.split("-").map(Number);
    const [h, mi] = timeStr.split(":").map(Number);
    return new Date(Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET_MS).toISOString();
  };

  const istDateKey = (iso: string) => istDateKeyFormat.format(new Date(iso));

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
        isHidden: singleIsHidden,
      }),
    });

    if (res.success) {
      setSuccess("Slot created successfully.");
      void fetchSlots(undefined, true);
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
      isHidden: bulkIsHidden,
    }));

    // Batch endpoint expects a raw JSON array (see bulkCreateSlotsSchema).
    const res = await apiFetch<{ count?: number }>("/admin/slots/bulk", {
      method: "POST",
      body: JSON.stringify(slotPayloads),
    });

    if (res.success) {
      setSuccess(`Successfully generated ${generated.length} slots for ${bulkDate}!`);
      void fetchSlots(undefined, true);
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
      void fetchSlots(undefined, true);
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

  const slotList = useMemo(() => (Array.isArray(slots) ? slots : []), [slots]);
  const bulkPreview = useMemo(
    () => getBulkSlotsPreview(),
    [slots, bulkDate, bulkStartTime, bulkEndTime, slotDurationMins],
  );

  // Extract unique dates (IST calendar days)
  const uniqueDates = useMemo(
    () =>
      Array.from(
        new Set(
          slotList
            .map((s) => (s.startTime ? istDateKey(s.startTime) : null))
            .filter((d): d is string => d !== null)
        )
      ).sort(),
    [slotList],
  );

  // Filtered slots
  const filteredSlots = useMemo(
    () =>
      slotList.filter((s) => {
        if (!filterDate) return true;
        if (!s.startTime) return false;
        return istDateKey(s.startTime) === filterDate;
      }),
    [slotList, filterDate],
  );

  // Reset to first page whenever the result set changes
  useEffect(() => {
    setPage(1);
  }, [filterDate, slotList.length]);

  const totalPages = Math.max(1, Math.ceil(filteredSlots.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedSlots = filteredSlots.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Plain admins bounce to check-in (see effect above) — render nothing meanwhile.
  if (role !== null && role !== "super_admin") return null;

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
          onClick={() => void refreshNow()}
          disabled={loading || refreshing}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#141417] border border-[#27272A] rounded-xl text-xs text-[#FAFAFA] hover:border-[#3F3F46] transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loading || refreshing ? "animate-spin" : ""}`} />
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

              {/* Hidden Slot Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="singleIsHidden"
                  checked={singleIsHidden}
                  onChange={(e) => setSingleIsHidden(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="singleIsHidden" className="text-xs text-[#A1A1AA] cursor-pointer flex items-center gap-1.5 select-none font-medium">
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" /> Mark as Hidden Slot (Admin Only)
                </label>
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

              {/* Bulk Hidden Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bulkIsHidden"
                  checked={bulkIsHidden}
                  onChange={(e) => setBulkIsHidden(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <label htmlFor="bulkIsHidden" className="text-xs text-[#A1A1AA] cursor-pointer flex items-center gap-1.5 select-none font-medium">
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" /> Mark All as Hidden Slots (Admin Only)
                </label>
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
                          {istTimeFormat.format(item.start)} - {istTimeFormat.format(item.end)}
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
                  className="w-4 h-4 accent-emerald-500 cursor-pointer [color-scheme:dark]"
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
              {pagedSlots.map((slot, idx) => {
                const startFormatted = slot.startTime
                  ? istDateTimeFormat.format(new Date(slot.startTime))
                  : "N/A";

                const endFormatted = slot.endTime
                  ? istTimeFormat.format(new Date(slot.endTime))
                  : "N/A";

                return (
                  <div
                    key={slot.id || idx}
                    className="p-3.5 sm:p-4 bg-[#141417] border border-[#27272A] hover:border-[#3F3F46] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      {canManageSlots && (
                        <input
                          type="checkbox"
                          checked={selected.has(slot.id)}
                          onChange={() => toggleSelect(slot.id)}
                          aria-label="Select slot"
                          className="mt-1 sm:mt-0 w-4 h-4 shrink-0 accent-emerald-500 cursor-pointer [color-scheme:dark]"
                        />
                      )}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-[#09090B] border border-[#27272A] text-xs font-mono text-emerald-400 rounded-md font-semibold">
                            Slot {(safePage - 1) * PAGE_SIZE + idx + 1}
                          </span>
                          {slot.isHidden && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-400 rounded-md font-semibold">
                              <EyeOff className="w-3 h-3 text-amber-400" /> HIDDEN
                            </span>
                          )}
                          <span
                            className={`px-2.5 py-0.5 border text-xs font-mono rounded-md font-semibold ${
                              (slot.bookedCount ?? 0) >= (slot.totalCapacity ?? 10)
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                                : (slot.bookedCount ?? 0) > 0
                                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                                : "bg-[#09090B] border-[#27272A] text-[#71717A]"
                            }`}
                          >
                            {slot.bookedCount ?? 0} / {slot.totalCapacity ?? 10} Booked
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-[#FAFAFA] flex items-center gap-2 mt-1">
                          <Clock className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0" />
                          <span>{startFormatted} - {endFormatted}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#27272A]/60 sm:border-transparent">
                      <button
                        type="button"
                        onClick={() => handleOpenSlotBookings(slot)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1F1F23] hover:bg-[#27272A] border border-[#27272A] hover:border-[#3F3F46] text-xs text-[#FAFAFA] font-medium rounded-xl transition-all cursor-pointer"
                        title="View booked players"
                      >
                        <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>View Players</span>
                        <span className="ml-0.5 px-1.5 py-0.2 bg-[#09090B] border border-[#27272A] rounded-full text-[10px] text-cyan-400 font-mono">
                          {slot.bookedCount ?? 0}
                        </span>
                      </button>

                      {canManageSlots && (
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 text-[#71717A] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all shrink-0"
                          title="Delete Slot (super admin only)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {filteredSlots.length > PAGE_SIZE && (
            <div className="p-3 bg-[#141417] border border-[#27272A] rounded-2xl flex items-center justify-between">
              <button
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="text-[11px] font-mono text-[#71717A]">
                Page {safePage} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Booked Players Modal */}
      {activeSlotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseSlotBookings();
          }}
        >
          <div
            className="bg-[#141417] border border-[#27272A] rounded-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-3.5 sm:p-5 border-b border-[#27272A] flex items-center justify-between gap-3 bg-[#18181C]">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                    <h3 className="text-sm font-semibold text-[#FAFAFA] tracking-tight truncate">
                      Slot Booked Players
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 border text-xs font-mono rounded-md font-semibold ${
                      (activeSlotModal.bookedCount ?? 0) >= (activeSlotModal.totalCapacity ?? 10)
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        : (activeSlotModal.bookedCount ?? 0) > 0
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                        : "bg-[#09090B] border-[#27272A] text-[#71717A]"
                    }`}
                  >
                    {activeSlotModal.bookedCount ?? 0} / {activeSlotModal.totalCapacity ?? 10} Booked
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#A1A1AA] flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-[#71717A] shrink-0" />
                  <span className="truncate">
                    {activeSlotModal.startTime
                      ? istDateTimeFormat.format(new Date(activeSlotModal.startTime))
                      : "N/A"}{" "}
                    -{" "}
                    {activeSlotModal.endTime
                      ? istTimeFormat.format(new Date(activeSlotModal.endTime))
                      : "N/A"}
                  </span>
                </p>
              </div>

              <button
                onClick={handleCloseSlotBookings}
                className="p-1.5 text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-xl transition-all cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3">
              {loadingBookings ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#71717A]">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-xs font-mono">Loading booked players...</span>
                </div>
              ) : bookingsError ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingsError}</span>
                </div>
              ) : slotBookings.length === 0 ? (
                <div className="py-12 text-center text-[#71717A] space-y-1">
                  <Users className="w-8 h-8 mx-auto text-[#3F3F46] mb-2" />
                  <p className="text-xs font-medium text-[#A1A1AA]">No players have booked this slot yet.</p>
                  <p className="text-[11px] text-[#71717A]">When participants register or choose this slot, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-[#71717A] font-mono flex items-center justify-between pb-1 border-b border-[#27272A]">
                    <span>PLAYER DETAILS ({slotBookings.length})</span>
                    <span>TYPE / STATUS</span>
                  </div>
                  {slotBookings.map((b, pIdx) => (
                    <div
                      key={b.bookingId || pIdx}
                      className="p-3 bg-[#09090B] border border-[#27272A] hover:border-[#3F3F46] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-[#FAFAFA] break-words">
                            {b.user.name || "Unknown Player"}
                          </span>
                          {b.user.regNumber && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px] rounded-md font-bold">
                              {b.user.regNumber}
                            </span>
                          )}
                          {!b.user.regNumber && (
                            <span className="px-2 py-0.5 bg-[#1F1F23] text-[#71717A] font-mono text-[10px] rounded-md">
                              NO REG NO
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-mono text-[#71717A] flex-wrap break-all">
                          <span>{b.user.email}</span>
                          {b.user.phNumber && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span>{b.user.phNumber}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center pt-1 sm:pt-0">
                        {b.type === "team" ? (
                          <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[11px] rounded-md font-medium">
                            Team {b.teamCode ? `(${b.teamCode})` : ""}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[11px] rounded-md font-medium">
                            Solo
                          </span>
                        )}

                        {b.isCheckedIn ? (
                          <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] rounded-md font-semibold flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Checked In
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px] rounded-md font-medium">
                            {b.status === "confirmed" ? "Confirmed" : "Reserved"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-[#27272A] bg-[#18181C] flex items-center justify-end">
              <button
                type="button"
                onClick={handleCloseSlotBookings}
                className="px-4 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-[#FAFAFA] text-xs font-semibold rounded-xl transition-all border border-[#3F3F46] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

