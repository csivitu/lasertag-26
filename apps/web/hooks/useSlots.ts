import { useState, useEffect, useCallback } from "react";
import { apiBaseUrl } from "@/lib/auth-client";

export interface SlotSideInfo {
  total: number;
  occupied: number;
  needed: number;
  available: number;
}

export interface Slot {
  id: string;
  day: string;
  month: string;
  dateKey: string;
  page: number;
  index: number;
  time: string;
  capacity: number;
  maxCapacity: number;
  startTime: string;
  endTime: string;
  red: SlotSideInfo;
  blue: SlotSideInfo;
}

interface RawApiSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  red?: SlotSideInfo;
  blue?: SlotSideInfo;
}

const SLOTS_PER_PAGE = 24;

export function formatSlotTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });
  } catch {
    return isoString;
  }
}

export function transformApiSlots(apiSlots: RawApiSlot[]): Slot[] {
  // Sort slots chronologically
  const sorted = [...apiSlots].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Group by UTC date (e.g. "2026-09-18")
  const dateGroups = new Map<string, RawApiSlot[]>();
  for (const slot of sorted) {
    const d = new Date(slot.startTime);
    const dateKey = d.toISOString().slice(0, 10);
    if (!dateGroups.has(dateKey)) {
      dateGroups.set(dateKey, []);
    }
    dateGroups.get(dateKey)!.push(slot);
  }

  const result: Slot[] = [];

  for (const [dateKey, group] of dateGroups.entries()) {
    group.forEach((slot, indexInDay) => {
      const d = new Date(slot.startTime);
      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = d.toLocaleDateString("en-US", {
        month: "short",
        timeZone: "UTC",
      }).toUpperCase();
      const page = Math.floor(indexInDay / SLOTS_PER_PAGE) + 1;
      const index = indexInDay % SLOTS_PER_PAGE;

      result.push({
        id: slot.id,
        day,
        month,
        dateKey,
        page,
        index,
        time: formatSlotTime(slot.startTime),
        capacity: slot.capacity,
        maxCapacity: 10,
        startTime: slot.startTime,
        endTime: slot.endTime,
        red: slot.red || { total: 5, occupied: 0, needed: 5, available: 5 },
        blue: slot.blue || { total: 5, occupied: 0, needed: 5, available: 5 },
      });
    });
  }

  return result;
}

export function useSlots() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/slots`, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load slots (status ${res.status})`);
      }

      const json = await res.json();
      const rawSlots: RawApiSlot[] = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json)
        ? json
        : [];

      setSlots(transformApiSlots(rawSlots));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load slots from server";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSlots();
  }, [fetchSlots]);

  const reserveSlot = async (
    slotId: string,
    options?: {
      userId?: string;
      type?: "individual" | "team";
      teamCode?: string;
      side?: "red" | "blue";
    }
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      if (options?.userId && options?.type) {
        const res = await fetch(`${apiBaseUrl}/slots/${slotId}/reserve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            user_id: options.userId,
            type: options.type,
            team_code: options.teamCode,
            side: options.side,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error ||
              body.message ||
              `Failed to reserve slot (status ${res.status})`
          );
        }

        const json = await res.json();
        return json.data;
      }

      // Fallback optimistic decrement
      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.id !== slotId) return slot;
          if (slot.capacity <= 0) return slot;
          return {
            ...slot,
            capacity: slot.capacity - 1,
          };
        })
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to reserve slot";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    slots,
    isLoading,
    error,
    refetch: fetchSlots,
    reserveSlot,
  };
}
