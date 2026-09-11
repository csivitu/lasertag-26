 "use client";

import { useState } from "react";
import { Starfield } from "../hero/Starfield";
import { DateSwitcher } from "./DateSwitcher";
import { SlotGrid } from "./SlotGrid";

const DATES = [
  { day: "18", month: "SEPT" },
  { day: "19", month: "SEPT" },
  { day: "20", month: "SEPT" },
];

const BOOKING_TIMES = ["9:30AM", "10:30AM", "11:30AM", "12:30PM"];

interface SlotBookingProps {
  activeDay?: string;
}

export function SlotBooking({ activeDay = "18" }: SlotBookingProps) {
  const [selectedDay, setSelectedDay] = useState(activeDay);
  const [selectedSlot, setSelectedSlot] = useState(1);
  const [selectedPage, setSelectedPage] = useState(1);
  const [bookingDay, setBookingDay] = useState(activeDay);
  const [bookingPage, setBookingPage] = useState(1);
  const dates = DATES.map((date) => ({
    ...date,
    active: date.day === selectedDay,
  }));

  const selectDate = (day: string) => {
    const page = DATES.findIndex((date) => date.day === day) + 1;
    setSelectedDay(day);
    setSelectedPage(page);
  };

  const selectPage = (page: number) => {
    setSelectedPage(page);
    setSelectedDay(DATES[page - 1].day);
  };

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
            SEPT {bookingDay}TH,{BOOKING_TIMES[Math.floor(selectedSlot / 6)]}
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
