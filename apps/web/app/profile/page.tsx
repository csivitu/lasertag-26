"use client";

import React from "react";
import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { UserProfileProvider, useUserProfile } from "@/hooks/useUserProfile";
import { Starfield } from "@/components/hero/Starfield";
import { HeroHeader } from "@/components/hero/HeroHeader";
import { ModeRequiredModal } from "@/components/mode-popup/ModeRequiredModal";
import { ProfileSolo } from "@/components/profile/profile-solo/ProfileSolo";
import { ProfileTeam1 } from "@/components/profile/profile-team1/ProfileTeam1";
import { ProfileTeam2 } from "@/components/profile/profile-team2/ProfileTeam2";

function ProfileContent() {
  const { profile, isLoading } = useUserProfile();

  if (isLoading) {
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
      (sessionStorage.getItem("lasertag_selected_mode") ||
        sessionStorage.getItem("lasertag_active_team") ||
        sessionStorage.getItem("lasertag_onboarding_solo")))
  );

  const hasBooking = Boolean(
    profile?.activeRegistration ||
    (typeof window !== "undefined" &&
      sessionStorage.getItem("lasertag_confirmed_slot"))
  );

  // If operative has not selected a mode yet, block access with the theme modal
  if (!hasMode) {
    return (
      <div className="relative isolate min-h-screen flex flex-col items-center justify-between bg-[#08080d] text-white pb-12 text-center">
        <Starfield />
        <HeroHeader />
        <ModeRequiredModal
          isOpen={true}
          title="ARENA COMBAT MODE REQUIRED"
          description="OPERATIVE, YOUR DIGITAL BATTLE PASS CANNOT BE GENERATED WITHOUT AN ACTIVE COMBAT PROTOCOL. PLEASE SELECT SOLO RECON, CREATE A SQUAD, OR JOIN AN EXISTING SQUAD FIRST."
          redirectUrl="/select-mode"
          buttonText="SELECT COMBAT MODE →"
        />
      </div>
    );
  }

  // If operative is part of a squad
  if (profile?.team) {
    // If the squad has already booked an arena slot, show ProfileTeam2 with QR pass and match details
    if (hasBooking) {
      return <ProfileTeam2 />;
    }
    // If the squad exists but slot is pending, show ProfileTeam1 (squad lobby pass with code, members, and slot booking trigger)
    return <ProfileTeam1 />;
  }

  // If operative is playing solo and has confirmed an arena slot
  if (hasBooking) {
    return <ProfileSolo />;
  }

  // Operative selected solo mode but has not booked an arena slot yet
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
          SLOT BOOKING REQUIRED
        </h2>

        <p className="font-pixel text-xs text-white/80 leading-relaxed max-w-md">
          OPERATIVE, YOU HAVE REGISTERED FOR SOLO RECON, BUT YOU MUST BOOK AN ARENA TIME SLOT TO SECURE YOUR DIGITAL BATTLE PASS.
        </p>

        <Link
          href="/slot-booking"
          className="font-pixel text-xs py-3.5 px-7 bg-[#FEDC02] text-black font-bold border-2 border-white hover:bg-[#ffe733] rounded-lg uppercase tracking-wider transition-all hover:scale-105 cursor-pointer shadow-[0_3px_0_#9c8400]"
        >
          BOOK A SLOT NOW →
        </Link>
      </div>
    </div>
  );
}

export default function ProfileGateway() {
  return (
    <AuthGate>
      <UserProfileProvider>
        <ProfileContent />
      </UserProfileProvider>
    </AuthGate>
  );
}
