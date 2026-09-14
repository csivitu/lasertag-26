"use client";

import Link from "next/link";
import { useUserProfile, UserProfileProvider } from "@/hooks/useUserProfile";
import { ProfileSolo } from "@/components/profile/profile-solo/ProfileSolo";
import { ProfileTeam1 } from "@/components/profile/profile-team1/ProfileTeam1";
import { ProfileTeam2 } from "@/components/profile/profile-team2/ProfileTeam2";
import { Starfield } from "@/components/hero/Starfield";
import { HeroHeader } from "@/components/hero/HeroHeader";
import { AuthGate } from "@/components/auth/AuthGate";

function ProfileContent() {
  const { profile, isLoading: profileLoading } = useUserProfile();

  // Show scanning only during initial load when profile is not yet available
  const isInitialLoading = profileLoading && !profile;

  if (isInitialLoading) {
    return (
      <div className="relative isolate min-h-screen flex items-center justify-center bg-[#08080d] text-white">
        <Starfield />
        <div className="relative z-10 font-pixel text-sm text-[#00F0FF] animate-pulse">
          SCANNING PLAYER CREDENTIALS...
        </div>
      </div>
    );
  }

  const hasMode = Boolean(
    profile?.team ||
    profile?.activeRegistration ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("lasertag_selected_mode") ||
        sessionStorage.getItem("lasertag_selected_mode") ||
        localStorage.getItem("lasertag_active_team") ||
        sessionStorage.getItem("lasertag_active_team") ||
        localStorage.getItem("lasertag_onboarding_solo") ||
        sessionStorage.getItem("lasertag_onboarding_solo")))
  );

  const hasBooking = Boolean(
    profile?.activeRegistration ||
    (typeof window !== "undefined" &&
      (sessionStorage.getItem("lasertag_confirmed_slot") ||
        localStorage.getItem("lasertag_confirmed_slot")))
  );

  // If operative has not booked a slot yet, display appropriate requirement message
  if (!hasBooking) {
    return (
      <div className="relative isolate min-h-screen flex flex-col items-center justify-between bg-[#08080d] text-white pb-12 text-center">
        <Starfield />
        <HeroHeader />
        <div className="relative z-10 max-w-lg p-8 border-2 border-[#FEDC02] bg-[#0c0c14]/95 rounded-2xl shadow-[0_0_40px_rgba(254,220,2,0.25)] flex flex-col items-center gap-6 my-auto mx-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FEDC02]/15 border-2 border-[#FEDC02] text-2xl">
            🎟️
          </div>

          <h2
            className="font-heading text-2xl text-[#FEDC02] uppercase tracking-wider"
            style={{ textShadow: "-2px 0 0 #E5349E" }}
          >
            {hasMode ? "SLOT BOOKING REQUIRED" : "NO BATTLE PASS FOUND"}
          </h2>

          <p className="font-pixel text-xs text-white/80 leading-relaxed max-w-md">
            {hasMode
              ? "OPERATIVE, YOU HAVE REGISTERED YOUR COMBAT MODE, BUT YOU MUST BOOK AN ARENA TIME SLOT TO SECURE YOUR DIGITAL BATTLE PASS."
              : "OPERATIVE, YOU MUST FIRST SELECT YOUR ARENA COMBAT MODE (SOLO OR TEAM) BEFORE BOOKING A TIME SLOT AND GENERATING YOUR PASS."}
          </p>

          <Link
            href={hasMode ? "/slot-booking" : "/register"}
            className="font-pixel text-xs py-3.5 px-7 bg-[#FEDC02] text-black font-bold border-2 border-white hover:bg-[#ffe733] rounded-lg uppercase tracking-wider transition-all hover:scale-105 cursor-pointer shadow-[0_3px_0_#9c8400]"
          >
            {hasMode ? "BOOK A SLOT NOW →" : "SELECT ARENA MODE →"}
          </Link>
        </div>
      </div>
    );
  }

  // Determine profile ticket variant from live backend database state
  if (profile?.team) {
    if (profile.team.isLeader) {
      return <ProfileTeam1 />;
    }
    return <ProfileTeam2 />;
  }

  return <ProfileSolo />;
}

export default function ProfileGateway() {
  return (
    <AuthGate
      title="RESTRICTED ACCESS"
      message="PLEASE SIGN IN TO IDENTIFY OPERATIVE STATUS AND VIEW YOUR DIGITAL BATTLE PASS."
    >
      <UserProfileProvider>
        <ProfileContent />
      </UserProfileProvider>
    </AuthGate>
  );
}
