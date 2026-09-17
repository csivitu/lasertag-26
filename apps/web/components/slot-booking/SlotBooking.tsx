"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Starfield } from "../hero/Starfield";
import { HeroHeader } from "../hero/HeroHeader";
import { PixelButton } from "../hero/PixelButton";
import { useSlots } from "../../hooks/useSlots";
import { DateSwitcher } from "./DateSwitcher";
import { SlotGrid } from "./SlotGrid";
import { useSession } from "@/lib/auth-client";
import { AuthModal } from "../auth/AuthModal";
import { BookingConfirmationModal } from "./BookingConfirmationModal";
import { useUserProfile } from "@/hooks/useUserProfile";
import { DetailsRequiredModal } from "./DetailsRequiredModal";

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
  // DEPRECATED: team feature disabled — solo-only flow, sign-in goes straight to booking.
  const [selectedMode, setSelectedMode] = useState<"solo" | "team" | null>("solo");
  const [activeTeam, setActiveTeam] = useState<{
    teamCode: string;
    teamName?: string;
    isLeader?: boolean;
  } | null>(null);

  // Confirmation modal state
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  // Operative verification state (DB-driven): details must be on the row,
  // and only paid (verified) participants may book.
  const { profile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile();
  const profileReady = !profileLoading;
  const needsDetails =
    !!session?.user &&
    profileReady &&
    (!profile?.regNumber?.trim() || !profile?.phone?.trim());
  const isPaid = profile?.paid === true;
  // Slot holders keep changing slots within their change allowance — the
  // paid block only gates FIRST bookings.
  const hasBooking = !!profile?.activeRegistration;
  const canBook = !!session?.user && profileReady && !needsDetails && (isPaid || hasBooking);

  // Server profile wins over local state, so a stale browser cache can
  // never disagree with the DB (e.g. ghost team blocking solo booking).
  // DEPRECATED: team feature disabled — always resolve to solo.
  const refreshMode = useCallback(() => {
    setSelectedMode("solo");
    setActiveTeam(null);
    return true;
    /* TEAM_FEATURE_DISABLED — team-aware refresh, uncomment to restore.
    const readLocal = (): boolean => {
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
            return true;
          }
        }

        if (mode === "solo" || soloStr) {
          setSelectedMode("solo");
          setActiveTeam(null);
          return true;
        }
      } catch {
        // fall through to cleared state
      }
      setSelectedMode(null);
      setActiveTeam(null);
      return false;
    };

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
            readLocal();
          }
        })
        .catch(() => {
          readLocal();
        });
    } else {
      readLocal();
    }
    END TEAM_FEATURE_DISABLED */
  }, []);

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

    // DEPRECATED: team/select-mode gate disabled — solo-only flow goes straight to booking.
    // if (!selectedMode) {
    //   router.push("/select-mode");
    //   return;
    // }

    // Verification gates: details popup handles itself; unpaid operatives
    // get the contact notice instead of a booking.
    if (needsDetails) {
      return;
    }
    if (!canBook) {
      setReserveError(
        profileReady && !isPaid && !hasBooking
          ? "Slot booking is open only for verified participants. If you have registered but slot booking is not available, please contact us."
          : "Verifying operative status, please wait..."
      );
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

    // DEPRECATED: team booking disabled — solo-only ("individual") flow.
    const type = "individual" as const;
    const teamCode = undefined;
    // const type = selectedMode === "team" ? "team" : "individual";
    // const teamCode = selectedMode === "team" ? activeTeam?.teamCode : undefined;
    void selectedMode;
    void activeTeam;

    try {
      await reserveSlot(booking.id, {
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
      const raw = err instanceof Error ? err.message : "Failed to reserve slot";
      // Lost the race for the last seat(s) — counts are already refreshed,
      // so say so plainly instead of surfacing the raw DB message.
      const msg = /slot is full|fully booked/i.test(raw)
        ? "THAT SLOT JUST FILLED — PLEASE PICK ANOTHER SLOT."
        : /slot change limit/i.test(raw)
          ? "YOU HAVE USED ALL 3 SLOT CHANGES — PLEASE CONTACT US FOR HELP."
          : raw;
      setReserveError(msg);
    } finally {
      setIsReserving(false);
    }
  };

  // DEPRECATED: team/select-mode gate disabled — solo-only flow, always show booking grid.
  // If operative has not established combat mode yet, show the mode required modal
  // if (!selectedMode) {
  //   return (
  //     <section className="slot-booking-screen relative flex min-h-screen flex-col items-center justify-between pb-8 bg-[var(--color-ink)] select-none">
  //       <Starfield />
  //       <HeroHeader />
  //       <ModeRequiredModal
  //         isOpen={true}
  //         title="COMBAT PROTOCOL REQUIRED"
  //         description="OPERATIVE, ACCESS TO ARENA TIME SLOTS REQUIRES AN ACTIVE COMBAT PROTOCOL. PLEASE SELECT SOLO RECON, CREATE A SQUAD, OR JOIN AN EXISTING SQUAD FIRST."
  //         redirectUrl="/select-mode"
  //         buttonText="SELECT COMBAT MODE →"
  //       />
  //     </section>
  //   );
  // }

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

      {/* Unpaid notice — first bookings stay greyed out until verified */}
      {profileReady && !needsDetails && !isPaid && !hasBooking && session?.user && (
        <div className="relative z-20 mx-auto max-w-md px-4 py-3 bg-[#0c0c14]/90 border-2 border-[#FEDC02] text-center my-2 rounded">
          <p className="font-pixel text-xs text-[#FEDC02] uppercase tracking-wider mb-1">
            Slot booking not available
          </p>
          <p className="font-pixel text-[10px] text-white/70 leading-relaxed">
            IF YOU HAVE REGISTERED BUT SLOT BOOKING IS NOT AVAILABLE, PLEASE CONTACT US.
          </p>
        </div>
      )}

      {/* ── Date switcher (only once loaded, and only when multiple dates have slots) ── */}
      {!isLoading && dates.length > 1 && (
        <div className="relative z-10 w-full">
          <DateSwitcher dates={dates} onSelect={selectDate} />
        </div>
      )}
      {/* ── Slot grid (greyed out until verified) ── */}
      <div
        className={`slot-grid-shell relative z-10 w-full min-h-0 ${
          !canBook ? "pointer-events-none opacity-40 saturate-50" : ""
        }`}
      >
        <SlotGrid
          activeDay={selectedDay}
          currentPage={selectedPage}
          selectedSlot={
            selectedDay === bookingDay && selectedPage === bookingPage
              ? selectedSlot
              : undefined
          }
          bookedSlotId={profile?.activeRegistration?.slotId}
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
          disabled={isReserving || selectedSlot === undefined || !canBook}
          label={
            isReserving
              ? "SECURING SLOT..."
              : !canBook && profileReady
              ? "BOOKING LOCKED"
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
            // DEPRECATED: team booking disabled — solo-only.
            type: "individual",
            teamName: undefined,
            teamCode: undefined,
            // type: selectedMode === "team" ? "team" : "individual",
            // teamName: activeTeam?.teamName,
            // teamCode: activeTeam?.teamCode,
          }}
          userInfo={{
            name: session?.user?.name,
            email: session?.user?.email,
          }}
        />
      )}

      {/* Persistent details gate — stays until reg number + phone are saved */}
      {needsDetails && (
        <DetailsRequiredModal
          regNumber={profile?.regNumber}
          phone={profile?.phone}
          onSaved={() => refetchProfile()}
        />
      )}
    </section>
  );
}
