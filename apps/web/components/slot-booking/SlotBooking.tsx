 "use client";

import { useState } from "react";
import { Starfield } from "../hero/Starfield";
import { useSlots } from "../../hooks/useSlots";
import { DateSwitcher } from "./DateSwitcher";
import { SlotGrid } from "./SlotGrid";

interface SlotBookingProps {
  activeDay?: string;
}

export function SlotBooking({ activeDay = "18" }: SlotBookingProps) {
  const { slots, isLoading, reserveSlot } = useSlots();
  const [selectedDay, setSelectedDay] = useState(activeDay);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [selectedPage, setSelectedPage] = useState(1);
  const [bookingDay, setBookingDay] = useState(activeDay);
  const [bookingPage, setBookingPage] = useState(1);
  const dates = [...new Map(slots.map((slot) => [slot.day, slot])).values()].map((slot) => ({
    day: slot.day,
    month: slot.month,
    active: slot.day === selectedDay,
  }));

  const selectDate = (day: string) => {
    setSelectedDay(day);
    setSelectedPage(1);
  };

  const selectPage = (page: number) => {
    setSelectedPage(page);
  };

  const booking = slots.find(
    (slot) =>
      slot.day === bookingDay &&
      slot.page === bookingPage &&
      slot.index === selectedSlot,
  );

  return (
    <section
      className="slot-booking-screen relative flex h-screen flex-col items-center overflow-hidden bg-[var(--color-ink)]"
    >
      {/* Starfield BG */}
      <Starfield />

      {/* ── SLOT BOOKING title ── */}
      <div className="relative z-10 text-center leading-none">
        <h1 className="slot-title m-0">SLOT BOOKING</h1>
      </div>

      {/* ── Current booking badge ── */}
      <div className="relative z-10">
        <div className="slot-current-badge">
          <span>
            {booking ? `${booking.month} ${booking.day}TH, ${booking.time}` : "SELECT A SLOT"}
          </span>
        </div>
      </div>

      {/* ── Date picker ── */}
      <div className="relative z-10 w-full">
        <DateSwitcher
          dates={dates}
          onSelect={selectDate}
        />
      </div>

      {/* ── Slot grid ── */}
      <div className="slot-grid-shell relative z-10 w-full min-h-0">
        <SlotGrid
          activeDay={selectedDay}
          currentPage={selectedPage}
          selectedSlot={
            selectedDay === bookingDay && selectedPage === bookingPage
              ? selectedSlot
              : undefined
          }
          slots={slots}
          isLoading={isLoading}
          reserveSlot={reserveSlot}
          onPageChange={selectPage}
          onSelectSlot={(slot) => {
            setBookingDay(slot.day);
            setSelectedSlot(slot.index);
            setBookingPage(selectedPage);
          }}
        />
      </div>
    </section>
  );
}
