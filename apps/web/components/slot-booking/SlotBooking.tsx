"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Starfield } from "../hero/Starfield";
import { HeroHeader } from "../hero/HeroHeader";
import { PixelButton } from "../hero/PixelButton";
import { useSlots } from "../../hooks/useSlots";
import { DateSwitcher } from "./DateSwitcher";
import { SlotGrid } from "./SlotGrid";
import { useSession, apiBaseUrl } from "@/lib/auth-client";
import { AuthModal } from "../auth/AuthModal";
import { BookingConfirmationModal } from "./BookingConfirmationModal";
import { ModeRequiredModal } from "../mode-popup/ModeRequiredModal";

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

  // Combat mode state
  const [selectedMode, setSelectedMode] = useState<"solo" | "team" | null>(null);
  const [activeTeam, setActiveTeam] = useState<{
    teamCode: string;
    teamName?: string;
    isLeader?: boolean;
  } | null>(null);

  // Confirmation modal state
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  // Synchronize player combat mode from local state or server profile
  const refreshMode = useCallback(() => {
    try {
      const mode =
        sessionStorage.getItem("lasertag_selected_mode") ||
        localStorage.getItem("lasertag_selected_mode");
      const teamStr =
        sessionStorage.getItem("lasertag_active_team") ||
        localStorage.getItem("lasertag_active_team");
      const soloStr =
        sessionStorage.getItem("lasertag_onboarding_solo") ||
        localStorage.getItem("lasertag_onboarding_solo");

      if (teamStr) {
        const parsed = JSON.parse(teamStr);
        if (parsed?.teamCode) {
          setSelectedMode("team");
          setActiveTeam(parsed);
          return;
        }
      }

      if (mode === "solo" || soloStr) {
        setSelectedMode("solo");
        setActiveTeam(null);
        return;
      }
    } catch {
      // fallback
    }

    if (session?.user) {
      fetch(`${apiBaseUrl}/users/me/profile`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.data?.team) {
            setSelectedMode("team");
            setActiveTeam({
              teamCode: data.data.team.teamCode || data.data.team.id,
              teamName: data.data.team.name,
              isLeader: data.data.team.leaderId === session.user.id,
            });
          } else if (data?.data?.activeRegistration) {
            setSelectedMode("solo");
            setActiveTeam(null);
          } else {
            setSelectedMode(null);
            setActiveTeam(null);
          }
        })
        .catch(() => {
          setSelectedMode(null);
          setActiveTeam(null);
        });
    } else {
      setSelectedMode(null);
      setActiveTeam(null);
    }
  }, [session]);

  useEffect(() => {
    refreshMode();
  }, [refreshMode]);

  // Group unique dates from actual slots loaded from DB (restricted strictly to 18th, 19th, 20th Sep)
  const dates = [...new Map(slots.map((slot) => [slot.day, slot])).values()]
    .filter((slot) => ["18", "19", "20"].includes(slot.day))
    .map((slot) => ({
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

  const handleProceedToConfirm = () => {
    if (!session?.user) {
      setAuthOpen(true);
      return;
    }

    if (!selectedMode) {
      router.push("/select-mode");
      return;
    }

    if (!booking) {
      setReserveError("Please select a time slot from the schedule below.");
      return;
    }

    setReserveError(null);
    setConfirmationOpen(true);
  };

  const executeReserve = async () => {
    if (!booking || !session?.user) return;

    setIsReserving(true);
    setReserveError(null);

    const type = selectedMode === "team" ? "team" : "individual";
    const teamCode = selectedMode === "team" ? activeTeam?.teamCode : undefined;

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

      setConfirmationOpen(false);
      // Transition to player pass profile
      router.push("/profile");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reserve slot";
      setReserveError(msg);
    } finally {
      setIsReserving(false);
    }
  };

  // If operative has not established combat mode yet, show the mode required modal
  if (!selectedMode) {
    return (
      <section className="slot-booking-screen relative flex min-h-screen flex-col items-center justify-between pb-8 bg-[var(--color-ink)] select-none">
        <Starfield />
        <HeroHeader />
        <ModeRequiredModal
          isOpen={true}
          title="COMBAT PROTOCOL REQUIRED"
          description="OPERATIVE, ACCESS TO ARENA TIME SLOTS REQUIRES AN ACTIVE COMBAT PROTOCOL. PLEASE SELECT SOLO RECON, CREATE A SQUAD, OR JOIN AN EXISTING SQUAD FIRST."
          redirectUrl="/select-mode"
          buttonText="SELECT COMBAT MODE →"
        />
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

      {/* ── Current booking badge + single date (side-by-side on desktop) ── */}
      <div className="slot-current-row relative z-10 my-2">
        {!isLoading && dates.length === 1 && (
          <div className="slot-date-box slot-date-static" aria-current="page">
            <span className="slot-date-day">{dates[0].day}</span>
            <span className="slot-date-month">{dates[0].month}</span>
          </div>
        )}
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
      {reserveError && !confirmationOpen && (
        <div className="relative z-20 mx-auto max-w-md px-4 py-2 bg-red-900/80 border border-red-500 text-red-200 text-xs font-pixel rounded text-center my-2">
          {reserveError}
        </div>
      )}

      {/* ── Date switcher (hidden when only one date has slots) ── */}
      {(isLoading || dates.length > 1) && (
        <div className="relative z-10 w-full">
          <DateSwitcher
            dates={
              dates.length > 0
                ? dates
                : [
                    { day: "18", month: "SEPT", active: selectedDay === "18" },
                    { day: "19", month: "SEPT", active: selectedDay === "19" },
                    { day: "20", month: "SEPT", active: selectedDay === "20" },
                  ]
            }
            onSelect={selectDate}
          />
        </div>
      )}
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
          onPageChange={selectPage}
          onSelectSlot={(slot) => {
            setBookingDay(slot.day);
            setSelectedSlot(slot.index);
            setBookingPage(selectedPage);
            setReserveError(null);
          }}
        />
      </div>

      {/* ── Bottom Section: Action Button ── */}
      <div className="relative z-10 flex flex-col items-center gap-3 mt-4 w-full max-w-[280px] sm:max-w-[320px]">
        <PixelButton
          type="button"
          onClick={handleProceedToConfirm}
          disabled={isReserving || selectedSlot === undefined}
          label={
            isReserving
              ? "SECURING SLOT..."
              : "CONFIRM RESERVATION"
          }
          interaction="hero"
          className="w-full"
          labelClassName="text-[clamp(11px,1.2vw,14px)] cursor-pointer"
        />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          refreshMode();
        }}
      />

      {/* Mission Confirmation Popup Modal */}
      {booking && (
        <BookingConfirmationModal
          isOpen={confirmationOpen}
          onClose={() => setConfirmationOpen(false)}
          onConfirm={executeReserve}
          isSubmitting={isReserving}
          error={reserveError}
          slotInfo={{
            day: booking.day,
            month: booking.month,
            time: booking.time,
          }}
          modeInfo={{
            type: selectedMode === "team" ? "team" : "individual",
            teamName: activeTeam?.teamName,
            teamCode: activeTeam?.teamCode,
          }}
          userInfo={{
            name: session?.user?.name,
            email: session?.user?.email,
          }}
        />
      )}
    </section>
  );
}
