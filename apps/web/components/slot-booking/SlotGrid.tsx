import { Pagination } from "./Pagination";
import { SlotCard, type SlotState } from "./SlotCard";

interface Slot {
  time: string;
  seatsLabel: string;
  state: Exclude<SlotState, "booked">;
}

const TOTAL_PAGES = 3;
const TIMES = ["9:30 AM", "10:30 AM", "11:30 AM", "12:30 PM"];

interface SlotGridProps {
  activeDay: string;
  currentPage: number;
  selectedSlot?: number;
  onPageChange: (page: number) => void;
  onSelectSlot: (slot: { day: string; index: number }) => void;
}

function getSlots(day: string, page: number): Slot[] {
  const dayOffset = Number(day) - 18;
  const fullSlotIndex = (dayOffset * 5 + page * 3) % 24;
  const fewSeatsIndex = (fullSlotIndex + 7) % 24;

  return Array.from({ length: 24 }, (_, index) => {
    const state =
      index === fullSlotIndex
        ? "full"
        : index === fewSeatsIndex
          ? "few_seats"
          : "available";
    return {
      time: TIMES[Math.floor(index / 6)],
      seatsLabel: state === "full" ? "Fully Booked" : state === "few_seats" ? `${(index % 3) + 1} Seats Left` : "6 Seats",
      state,
    };
  });
}

export function SlotGrid({
  activeDay,
  currentPage,
  selectedSlot,
  onPageChange,
  onSelectSlot,
}: SlotGridProps) {
  const slots = getSlots(activeDay, currentPage);

  const goToPreviousPage = () => onPageChange(currentPage === 1 ? TOTAL_PAGES : currentPage - 1);
  const goToNextPage = () => onPageChange(currentPage === TOTAL_PAGES ? 1 : currentPage + 1);

  return (
    <>
      <div className="slot-grid">
        {slots.map((slot, i) => {
          const isSelected = selectedSlot === i;
          const isFull = slot.state === "full";

          return (
            <SlotCard
              key={i}
              time={slot.time}
              seatsLabel={isSelected ? "Your Booking" : slot.seatsLabel}
              state={isSelected ? "booked" : slot.state}
              onClick={isFull ? undefined : () => onSelectSlot({ day: activeDay, index: i })}
              isSelected={isSelected}
              isDisabled={isFull}
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
