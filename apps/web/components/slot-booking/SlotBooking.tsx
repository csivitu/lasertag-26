"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Starfield } from "../hero/Starfield";
import { HeroHeader } from "../hero/HeroHeader";
import { PixelButton } from "../hero/PixelButton";
import { useSlots } from "../../hooks/useSlots";
import { DateSwitcher } from "./DateSwitcher";
import { SlotGrid } from "./SlotGrid";
import { useSession, apiBaseUrl } from "@/lib/auth-client";
import { AuthModal } from "../auth/AuthModal";

interface SlotBookingProps {
  activeDay?: string;
}

function getOrdinalSuffix(day: string | number): string {
  const n = typeof day === "string" ? parseInt(day, 10) : day;
  if (isNaN(n)) return "TH";
  if (n >= 11 && n <= 13) return "TH";
  switch (n % 10) {
    case 1:
      return "ST";
    case 2:
      return "ND";
    case 3:
      return "RD";
    default:
      return "TH";
  }
}

export function SlotBooking({ activeDay = "18" }: SlotBookingProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { slots, isLoading, reserveSlot } = useSlots();
  const [selectedDay, setSelectedDay] = useState(activeDay);
  const [selectedSlot, setSelectedSlot] = useState<number | undefined>(1);
  const [selectedPage, setSelectedPage] = useState(1);
  const [bookingDay, setBookingDay] = useState(activeDay);
  const [bookingPage, setBookingPage] = useState(1);
  const [isReserving, setIsReserving] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);

  // Track whether the player has selected an arena mode (Solo or Team)
  const [hasSelectedMode, setHasSelectedMode] = useState<boolean | null>(null);

  useEffect(() => {
    // Check local / session storage for selected mode
    const mode =
      sessionStorage.getItem("lasertag_selected_mode") ||
      localStorage.getItem("lasertag_selected_mode") ||
      sessionStorage.getItem("lasertag_onboarding_solo") ||
      localStorage.getItem("lasertag_onboarding_solo") ||
      sessionStorage.getItem("lasertag_active_team") ||
      localStorage.getItem("lasertag_active_team");

    if (mode) {
      setHasSelectedMode(true);
      return;
    }

    // If signed in, check user profile in DB to see if an active registration or team exists
    if (session?.user) {
      fetch(`${apiBaseUrl}/users/me/profile`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.data?.team || data?.data?.activeRegistration) {
            setHasSelectedMode(true);
          } else {
            setHasSelectedMode(false);
          }
        })
        .catch(() => setHasSelectedMode(false));
    } else {
      setHasSelectedMode(false);
    }
  }, [session]);

  // Group unique dates from actual slots loaded from DB
  const dates = [...new Map(slots.map((slot) => [slot.day, slot])).values()].map((slot) => ({
    day: slot.day,
    month: slot.month,
    active: slot.day === selectedDay,
  }));

  // Auto-select activeDay if available in DB, or fallback to first loaded day
  useEffect(() => {
    if (dates.length > 0 && !dates.some((d) => d.day === selectedDay)) {
      setSelectedDay(dates[0].day);
      setBookingDay(dates[0].day);
    }
  }, [dates, selectedDay]);

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
      slot.index === selectedSlot
  );

  const handleReserve = async () => {
    if (!booking) return;

    if (!session?.user) {
      setAuthOpen(true);
      return;
    }

    if (hasSelectedMode === false) {
      setReserveError("MODE REQUIRED: You must select your arena combat mode (Solo or Team) before booking a slot.");
      return;
    }

    setIsReserving(true);
    setReserveError(null);

    let type: "individual" | "team" = "individual";
    let teamCode: string | undefined = undefined;

    try {
      const activeTeamStr =
        sessionStorage.getItem("lasertag_active_team") ||
        localStorage.getItem("lasertag_active_team");
      if (activeTeamStr) {
        const teamObj = JSON.parse(activeTeamStr);
        if (teamObj?.teamCode) {
          type = "team";
          teamCode = teamObj.teamCode;
        }
      }
    } catch {
      // fallback to individual
    }

    try {
      await reserveSlot(booking.id, {
        userId: session.user.id,
        type,
        teamCode,
      });

      // Save confirmed slot summary in sessionStorage and localStorage for immediate pass display
      const confirmedPayload = {
        slotId: booking.id,
        day: booking.day,
        month: booking.month,
        time: booking.time,
        startTime: booking.startTime,
        endTime: booking.endTime,
      };
      sessionStorage.setItem("lasertag_confirmed_slot", JSON.stringify(confirmedPayload));
      localStorage.setItem("lasertag_confirmed_slot", JSON.stringify(confirmedPayload));

      // Transition to player pass profile
      router.push("/profile");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reserve slot";
      setReserveError(msg);
    } finally {
      setIsReserving(false);
    }
  };

  // If operative has not chosen a combat mode yet, display requirement screen
  if (hasSelectedMode === false) {
    return (
      <section className="slot-booking-screen relative flex min-h-screen flex-col items-center justify-between pb-8 bg-[var(--color-ink)] select-none">
        <Starfield />
        <HeroHeader />

        <div className="relative z-10 max-w-lg p-8 border-2 border-[#FEDC02] bg-[#0c0c14]/95 rounded-2xl shadow-[0_0_40px_rgba(254,220,2,0.25)] flex flex-col items-center gap-6 my-auto mx-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FEDC02]/15 border-2 border-[#FEDC02] text-2xl">
            ⚔️
          </div>

          <h2
            className="font-heading text-2xl text-[#FEDC02] uppercase tracking-wider"
            style={{ textShadow: "-2px 0 0 #E5349E" }}
          >
            ARENA MODE REQUIRED
          </h2>

          <p className="font-pixel text-xs text-white/80 leading-relaxed max-w-md">
            OPERATIVE, YOU MUST FIRST SELECT YOUR ARENA COMBAT MODE (SOLO OR TEAM) BEFORE BOOKING A TIME SLOT.
          </p>

          <Link
            href="/register"
            className="font-pixel text-xs py-3.5 px-7 bg-[#FEDC02] text-black font-bold border-2 border-white hover:bg-[#ffe733] rounded-lg uppercase tracking-wider transition-all hover:scale-105 cursor-pointer shadow-[0_3px_0_#9c8400]"
          >
            SELECT ARENA MODE &rarr;
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="slot-booking-screen relative flex min-h-screen flex-col items-center justify-between pb-8 bg-[var(--color-ink)] select-none">
      {/* Starfield BG */}
      <Starfield />

      {/* Top Retro Navigation Header */}
      <HeroHeader />

      {/* ── SLOT BOOKING title ── */}
      <div className="relative z-10 text-center leading-none mt-2">
        <h1 className="slot-title m-0">SLOT BOOKING</h1>
      </div>

      {/* ── Current booking badge ── */}
      <div className="relative z-10 my-2">
        <div className="slot-current-badge">
          <span className="slot-current-label">CURRENT BOOKING:</span>
          <span className="slot-current-val">
            {booking
              ? `${booking.day}${getOrdinalSuffix(booking.day)} ${booking.month.toUpperCase()} ${booking.time}`
              : "SELECT A TIME SLOT"}
          </span>
        </div>
      </div>

      {/* Error message */}
      {reserveError && (
        <div className="relative z-20 mx-auto max-w-md px-4 py-2 bg-red-900/80 border border-red-500 text-red-200 text-xs font-pixel rounded text-center my-2">
          {reserveError}
        </div>
      )}

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

      {/* ── Bottom Section: Action Button ── */}
      <div className="relative z-10 flex flex-col items-center gap-3 mt-4 w-full max-w-[280px] sm:max-w-[320px]">
        <PixelButton
          type="button"
          onClick={handleReserve}
          disabled={isReserving || selectedSlot === undefined}
          label={isReserving ? "SECURING SLOT..." : "CONFIRM RESERVATION"}
          interaction="hero"
          className="w-full"
          labelClassName="text-[clamp(11px,1.2vw,14px)] cursor-pointer"
        />
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={handleReserve}
      />
    </section>
  );
}
