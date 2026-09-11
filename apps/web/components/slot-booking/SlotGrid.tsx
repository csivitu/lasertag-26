import { Pagination } from "./Pagination";
import { SlotCard, type SlotState } from "./SlotCard";
import type { Slot } from "../../hooks/useSlots";

const TOTAL_PAGES = 3;
interface SlotGridProps {
  activeDay: string;
  currentPage: number;
  selectedSlot?: number;
  slots: Slot[];
  isLoading: boolean;
  reserveSlot: (slotId: string) => Promise<void>;
  onPageChange: (page: number) => void;
  onSelectSlot: (slot: { day: string; index: number }) => void;
}

export function SlotGrid({
  activeDay,
  currentPage,
  selectedSlot,
  slots,
  isLoading,
  reserveSlot,
  onPageChange,
  onSelectSlot,
}: SlotGridProps) {
  const visibleSlots = slots.filter(
    (slot) => slot.day === activeDay && slot.page === currentPage,
  );

  const goToPreviousPage = () => onPageChange(currentPage === 1 ? TOTAL_PAGES : currentPage - 1);
  const goToNextPage = () => onPageChange(currentPage === TOTAL_PAGES ? 1 : currentPage + 1);

  return (
    <>
      <div className="slot-grid">
        {visibleSlots.map((slot) => {
          const isSelected = selectedSlot === slot.index;
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
              seatsLabel={isSelected ? "Your Booking" : isFull ? "Fully Booked" : `${slot.capacity} Seats`}
              state={isSelected ? "booked" : state}
              onClick={isFull || isLoading ? undefined : () => {
                onSelectSlot({ day: activeDay, index: slot.index });
                void reserveSlot(slot.id);
              }}
              isSelected={isSelected}
              isDisabled={isFull || isLoading}
            />
          );
        })}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={TOTAL_PAGES}
        onPrevious={goToPreviousPage}
        onNext={goToNextPage}
      />
    </>
  );
}
