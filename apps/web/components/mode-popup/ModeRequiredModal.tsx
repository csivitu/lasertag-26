"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { MODAL_BORDER_SVG, borderBg } from "./modePopupDecor";
import { PixelButton } from "../hero/PixelButton";

interface ModeRequiredModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  redirectUrl?: string;
  buttonText?: string;
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.88)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 70,
  padding: "16px",
};

const cardStyle: CSSProperties = {
  position: "relative",
  background: borderBg(MODAL_BORDER_SVG),
  padding: "36px 32px 32px",
  width: "500px",
  maxWidth: "94vw",
  maxHeight: "90vh",
  overflowY: "auto",
  boxSizing: "border-box",
};

export function ModeRequiredModal({
  isOpen,
  title = "ARENA MODE REQUIRED",
  description = "OPERATIVE, ACCESS TO ARENA TIME SLOTS AND YOUR DIGITAL BATTLE PASS REQUIRES AN ACTIVE COMBAT PROTOCOL. PLEASE SELECT SOLO RECON, CREATE A SQUAD, OR JOIN AN EXISTING SQUAD FIRST.",
  // DEPRECATED: team/select-mode flow disabled — default now goes straight to booking.
  redirectUrl = "/slot-booking",
  buttonText = "SELECT ARENA MODE →",
}: ModeRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div style={cardStyle} className="text-white text-center flex flex-col items-center">
        {/* Step Badge */}
        <div className="inline-block px-3 py-1 rounded bg-[#FEDC02]/10 border border-[#FEDC02]/40 text-[#FEDC02] font-pixel text-[10px] tracking-widest uppercase mb-4">
          RESTRICTED PROTOCOL
        </div>

        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-full bg-[#E5349E]/15 border-2 border-[#E5349E] flex items-center justify-center text-2xl mb-4 text-[#E5349E] shadow-[0_0_20px_rgba(229,52,158,0.4)]">
          ⚠️
        </div>

        {/* Modal Title */}
        <h2
          className="font-heading text-xl sm:text-2xl text-[#FEDC02] uppercase tracking-wider mb-3 leading-snug"
          style={{ textShadow: "-2px 0 0 #E5349E, 2px 2px 0 rgba(0,0,0,0.8)" }}
        >
          {title}
        </h2>

        {/* Description */}
        <p className="font-pixel text-xs text-white/80 leading-relaxed mb-6 max-w-sm">
          {description}
        </p>

        {/* Action Button */}
        <div className="w-full flex justify-center pt-2">
          <PixelButton
            label={buttonText}
            onClick={() => router.push(redirectUrl)}
            className="w-full sm:w-auto min-w-[240px]"
            interaction="hero"
          />
        </div>
      </div>
    </div>
  );
}
