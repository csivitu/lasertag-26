"use client";

import type { CSSProperties } from "react";
import { useUserProfile, UserProfileProvider } from "@/hooks/useUserProfile";
import { ProfileSolo } from "@/components/profile/profile-solo/ProfileSolo";
// DEPRECATED: team feature disabled — solo-only flow.
// import { ProfileTeam2 } from "@/components/profile/profile-team2/ProfileTeam2";
import { Starfield } from "@/components/hero/Starfield";
import { HeroHeader } from "@/components/hero/HeroHeader";
import { AuthGate } from "@/components/auth/AuthGate";
import { ModeRequiredModal } from "@/components/mode-popup/ModeRequiredModal";
import { PixelButton } from "@/components/hero/PixelButton";
import {
  MODAL_BORDER_SVG,
  borderBg,
} from "@/components/mode-popup/modePopupDecor";

const cardStyle: CSSProperties = {
  position: "relative",
  background: borderBg(MODAL_BORDER_SVG),
  padding: "40px 36px 32px",
  width: "100%",
  maxWidth: "28rem",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "20px",
};

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

  // DEPRECATED: team feature disabled — solo-only flow, mode step skipped.
  // Mode is implied; only booking is required.
  const hasMode = true;
  // const hasMode = Boolean(
  //   profile?.team ||
  //   profile?.activeRegistration ||
  //   (typeof window !== "undefined" &&
  //     (localStorage.getItem("lasertag_selected_mode") ||
  //       sessionStorage.getItem("lasertag_selected_mode") ||
  //       localStorage.getItem("lasertag_active_team") ||
  //       sessionStorage.getItem("lasertag_active_team") ||
  //       localStorage.getItem("lasertag_onboarding_solo") ||
  //       sessionStorage.getItem("lasertag_onboarding_solo")))
  // );

  const hasBooking = Boolean(
    profile?.activeRegistration ||
    (typeof window !== "undefined" &&
      (sessionStorage.getItem("lasertag_confirmed_slot") ||
        localStorage.getItem("lasertag_confirmed_slot")))
  );

  // If operative has not selected a mode yet, block access with the theme modal
  // DEPRECATED: team/select-mode step disabled — redirect straight to booking.
  if (!hasMode) {
    return (
      <div className="relative isolate min-h-screen flex flex-col items-center justify-between bg-[#08080d] text-white pb-12 text-center">
        <Starfield />
        <HeroHeader />
        <ModeRequiredModal
          isOpen={true}
          title="ARENA COMBAT MODE REQUIRED"
          description="OPERATIVE, YOUR DIGITAL BATTLE PASS CANNOT BE GENERATED WITHOUT AN ACTIVE COMBAT PROTOCOL. PLEASE SELECT SOLO RECON, CREATE A SQUAD, OR JOIN AN EXISTING SQUAD FIRST."
          redirectUrl="/slot-booking"
          buttonText="BOOK A SLOT →"
        />
      </div>
    );
  }

  // If operative has selected a mode but not booked a slot yet
  if (!hasBooking) {
    return (
      <div className="relative isolate min-h-screen flex flex-col items-center justify-between bg-[#08080d] text-white pb-12 text-center">
        <Starfield />
        <HeroHeader />
        <div style={cardStyle} className="relative z-10 my-auto mx-4">
          <h2 className="font-pixel text-[#FEDC02] text-center uppercase text-[clamp(14px,2.4vw,19px)] leading-relaxed tracking-[0.08em]">
            SLOT BOOKING REQUIRED
          </h2>

          <p className="font-body text-center text-[15px] leading-relaxed text-white/80">
            Operative, you have registered your combat protocol, but you must book an arena time slot to secure your digital battle pass.
          </p>

          <PixelButton
            label="BOOK A SLOT NOW →"
            href="/slot-booking"
            interaction="simple"
            className="w-[280px]"
            labelClassName="text-[13px]"
          />
        </div>
      </div>
    );
  }

  // Determine profile ticket variant from live backend database state
  // DEPRECATED: team feature disabled — always render solo pass.
  // if (profile?.team) {
  //   // Both leader and team members with confirmed booking get the complete pass with slot + QR
  //   return <ProfileTeam2 />;
  // }
  void profile;

  return <ProfileSolo />;
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
