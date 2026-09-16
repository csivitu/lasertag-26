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
    memberCount?: number;
  } | null>(null);

  // Confirmation modal state
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  // Synchronize player combat mode directly from session or server profile (Zero localStorage)
  const refreshMode = useCallback(() => {
    try {
      const mode = sessionStorage.getItem("lasertag_selected_mode");
      const teamStr = sessionStorage.getItem("lasertag_active_team");
      const soloStr = sessionStorage.getItem("lasertag_onboarding_solo");

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
              isLeader: Boolean(
                data.data.team.isLeader ??
                (data.data.team.leaderId === session.user.id)
              ),
              memberCount: data.data.team.memberCount || data.data.team.members?.length || 1,
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

  const isNonLeaderTeamMember = selectedMode === "team" && activeTeam?.isLeader === false;
  const isLeaderAlone = selectedMode === "team" && activeTeam?.isLeader === true && (activeTeam?.memberCount ?? 1) < 2;

  const handleProceedToConfirm = () => {
    if (!session?.user) {
      setAuthOpen(true);
      return;
    }

    if (!selectedMode) {
      router.push("/register");
      return;
    }

    if (isNonLeaderTeamMember) {
      setReserveError("Only team leader can book slot.");
      return;
    }

    if (isLeaderAlone) {
      setReserveError("At least 1 teammate must join before you can book a slot.");
      return;
    }

    if (!booking) {
      setReserveError("Please select a time slot from the schedule below.");
      return;
    }

    setReserveError(null);
    setConfirmationOpen(true);
  };

  const executeReserve = async (selectedSide: "red" | "blue") => {
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
        side: selectedSide,
      });

      // Save confirmed slot summary in sessionStorage for immediate pass display
      const confirmedPayload = {
        slotId: booking.id,
        day: booking.day,
        month: booking.month,
        time: booking.time,
        startTime: booking.startTime,
        endTime: booking.endTime,
        side: selectedSide,
      };
      sessionStorage.setItem("lasertag_confirmed_slot", JSON.stringify(confirmedPayload));

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
          redirectUrl="/register"
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

      {/* ── Active Combat Mode Status Bar ── */}
      <div className="relative z-20 w-full max-w-xl px-4 my-1">
        <div className="bg-[#0b0c14]/90 border border-white/20 rounded-lg py-1.5 px-4 flex items-center justify-center font-mono text-xs text-white/80">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs">⚔️</span>
            <span className="text-white/60">DEPLOYMENT:</span>
            <span className="text-[#FEDC02] font-bold truncate">
              {selectedMode === "team"
                ? `SQUAD ${activeTeam?.teamName ? `\"${activeTeam.teamName}\" ` : ""}[${activeTeam?.teamCode || ""}] ${
                    activeTeam?.isLeader ? "(LEADER)" : "(MEMBER)"
                  } • ${activeTeam?.memberCount || 1}/5 OPERATIVES`
                : "SOLO RECON MISSION"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Current booking badge ── */}
      <div className="relative z-10 my-2">
        <div className="slot-current-badge">
          <span className="slot-current-label">CURRENT BOOKING:</span>
          <span className="slot-current-val">
            {booking
              ? `${booking.day}${getOrdinalSuffix(booking.day)} ${booking.month.toUpperCase()} ${booking.time} [RED: ${booking.red?.needed ?? 5} / BLUE: ${booking.blue?.needed ?? 5} NEEDED]`
              : "SELECT A TIME SLOT"}
          </span>
        </div>
      </div>

      {/* Error / Warning Notice Banner */}
      {reserveError && !confirmationOpen && (
        <div className="relative z-20 mx-auto max-w-md px-4 py-2 bg-red-900/90 border border-red-500 text-red-100 text-xs font-pixel rounded text-center my-2 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce">
          {reserveError}
        </div>
      )}

      {/* Non-leader informative notice banner */}
      {isNonLeaderTeamMember && (
        <div className="relative z-20 mx-auto max-w-md px-3 py-1.5 bg-[#171726] border border-gray-500 text-gray-300 text-[11px] font-mono rounded text-center my-1">
          🔒 You are viewing this slot schedule as a squad operative. Only the squad leader can confirm slot reservations.
        </div>
      )}

      {/* Leader alone informative notice banner */}
      {isLeaderAlone && (
        <div className="relative z-20 mx-auto max-w-md px-3 py-1.5 bg-[#26170d] border border-amber-600 text-amber-200 text-[11px] font-mono rounded text-center my-1">
          ⚠️ At least 1 teammate must join your squad before you can book an arena slot.
        </div>
      )}

      {/* ── Date switcher (18, 19, 20 September) ── */}
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
      <div className="relative z-10 flex flex-col items-center gap-3 mt-4 w-full max-w-[300px] sm:max-w-[340px]">
        {isNonLeaderTeamMember ? (
          <button
            type="button"
            onClick={() => setReserveError("only leader can book slot")}
            className="w-full py-3.5 px-4 bg-[#202028] text-gray-400 border-2 border-gray-600 font-pixel text-xs rounded uppercase tracking-wider cursor-not-allowed transition-all opacity-60 hover:opacity-80"
          >
            CONFIRM BOOKING (ONLY LEADER CAN BOOK)
          </button>
        ) : isLeaderAlone ? (
          <button
            type="button"
            onClick={() => setReserveError("At least 1 teammate must join before you can book slot.")}
            className="w-full py-3.5 px-4 bg-[#2d1b10] text-amber-300 border-2 border-amber-700 font-pixel text-xs rounded uppercase tracking-wider cursor-not-allowed opacity-80 hover:opacity-90"
          >
            WAITING FOR SQUAD (1/5 JOINED)
          </button>
        ) : (
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
        )}
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
            red: booking.red || { total: 5, occupied: 0, needed: 5, available: 5 },
            blue: booking.blue || { total: 5, occupied: 0, needed: 5, available: 5 },
          }}
          modeInfo={{
            type: selectedMode === "team" ? "team" : "individual",
            teamName: activeTeam?.teamName,
            teamCode: activeTeam?.teamCode,
            memberCount: activeTeam?.memberCount,
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
