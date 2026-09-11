import { useState } from "react";

export interface Slot {
  id: string;
  day: string;
  month: string;
  page: number;
  index: number;
  time: string;
  capacity: number;
  maxCapacity: number;
}

const TIMES = ["9:30 AM", "10:30 AM", "11:30 AM", "12:30 PM"];
const DAYS = ["18", "19", "20"];
const TOTAL_PAGES = 3;
const SLOTS_PER_PAGE = 24;

function createMockSlots(): Slot[] {
  return DAYS.flatMap((day, dayIndex) =>
    Array.from({ length: TOTAL_PAGES * SLOTS_PER_PAGE }, (_, slotIndex) => {
      const page = Math.floor(slotIndex / SLOTS_PER_PAGE) + 1;
      const index = slotIndex % SLOTS_PER_PAGE;
      const capacity = (dayIndex + page + index) % 9 === 0
        ? 0
        : (dayIndex + page + index) % 5 === 0
          ? 1 + (index % 2)
          : 6;

      return {
        id: `${day}-${page}-${index}`,
        day,
        month: "SEPT",
        page,
        index,
        time: TIMES[Math.floor(index / 6)],
        capacity,
        maxCapacity: 6,
      };
    }),
  );
}

export function useSlots() {
  const [slots, setSlots] = useState<Slot[]>(createMockSlots);
  const [isLoading, setIsLoading] = useState(false);

  const reserveSlot = async (slotId: string) => {
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    setSlots((currentSlots) =>
      currentSlots.map((slot) =>
        slot.id === slotId && slot.capacity > 0
          ? { ...slot, capacity: slot.capacity - 1 }
          : slot,
      ),
    );
    setIsLoading(false);
  };

  return { slots, isLoading, reserveSlot };
}