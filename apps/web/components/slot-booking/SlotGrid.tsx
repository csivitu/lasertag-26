import { Pagination } from "./Pagination";
import { SlotCard, type SlotState } from "./SlotCard";
import type { Slot } from "../../hooks/useSlots";

const SLOTS_PER_PAGE = 24;

interface SlotGridProps {
  activeDay: string;
  currentPage: number;
  selectedSlot?: number;
  bookedSlotId?: string;
  slots: Slot[];
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onSelectSlot: (slot: { day: string; index: number }) => void;
}

export function SlotGrid({
  activeDay,
  currentPage,
  selectedSlot,
  bookedSlotId,
  slots,
  isLoading,
  onPageChange,
  onSelectSlot,
}: SlotGridProps) {
  const daySlots = slots.filter((slot) => slot.day === activeDay);
  const totalPages = Math.max(1, Math.ceil(daySlots.length / SLOTS_PER_PAGE));
  const visibleSlots = daySlots.filter((slot) => slot.page === currentPage);

  const goToPreviousPage = () =>
    onPageChange(currentPage <= 1 ? totalPages : currentPage - 1);
  const goToNextPage = () =>
    onPageChange(currentPage >= totalPages ? 1 : currentPage + 1);

  return (
    <>
      <div className="slot-grid">
        {visibleSlots.map((slot) => {
          const isSelected = selectedSlot === slot.index;
          const isBookedSlot = bookedSlotId === slot.id;
          const state: SlotState =
            slot.capacity === 0
              ? "full"
              : slot.capacity <= 2
                ? "few_seats"
                : "available";
          const isFull = state === "full";

          return (
            <SlotCard
              key={slot.id}
              time={slot.time}
              seatsLabel={
                isSelected
                  ? "Selected Slot"
                  : isBookedSlot
                    ? "BOOKED SLOT"
                    : isFull
                      ? "Fully Booked"
                      : `${slot.capacity} Seats`
              }
              state={isSelected ? "booked" : isBookedSlot ? "bookedslot" : state}
              onClick={
                isFull || isLoading
                  ? undefined
                  : () => {
                      onSelectSlot({ day: activeDay, index: slot.index });
                    }
              }
              isSelected={isSelected}
              isDisabled={isFull || isLoading}
            />
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
        />
      )}
    </>
  );
}
