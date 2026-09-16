import { useState, useEffect, useCallback } from "react";
import { apiBaseUrl } from "@/lib/auth-client";

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
}

interface RawApiSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
}

const SLOTS_PER_PAGE = 24;

// Arena wall-clock is IST. Slots are stored as UTC instants; every display
// derives from Asia/Kolkata so grid, badge, and pass always agree.
export const ARENA_TIME_ZONE = "Asia/Kolkata";

export function formatSlotTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: ARENA_TIME_ZONE,
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

  // Group by IST date (e.g. "2026-09-18")
  const dateGroups = new Map<string, RawApiSlot[]>();
  for (const slot of sorted) {
    const d = new Date(slot.startTime);
    const dateKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: ARENA_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    if (!dateGroups.has(dateKey)) {
      dateGroups.set(dateKey, []);
    }
    dateGroups.get(dateKey)!.push(slot);
  }

  const result: Slot[] = [];

  for (const [dateKey, group] of dateGroups.entries()) {
    group.forEach((slot, indexInDay) => {
      const d = new Date(slot.startTime);
      const day = String(
        Number(
          new Intl.DateTimeFormat("en-US", {
            timeZone: ARENA_TIME_ZONE,
            day: "numeric",
          }).format(d)
        )
      ).padStart(2, "0");
      const month = d.toLocaleDateString("en-US", {
        month: "short",
        timeZone: ARENA_TIME_ZONE,
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
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(
            errBody.error ||
              errBody.message ||
              "Failed to reserve slot in database"
          );
        }
      }

      // Optimistically decrement capacity locally
      setSlots((currentSlots) =>
        currentSlots.map((slot) =>
          slot.id === slotId && slot.capacity > 0
            ? { ...slot, capacity: slot.capacity - 1 }
            : slot
        )
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

  return { slots, isLoading, error, reserveSlot, refetch: fetchSlots };
}
