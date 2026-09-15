"use client";

import type { CSSProperties } from "react";
import { MODAL_BORDER_SVG, borderBg } from "../mode-popup/modePopupDecor";
import { PixelButton } from "../hero/PixelButton";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  error: string | null;
  slotInfo: {
    day: string;
    month: string;
    time: string;
  };
  modeInfo: {
    type: "individual" | "team";
    teamName?: string;
    teamCode?: string;
  };
  userInfo?: {
    name?: string;
    email?: string;
  };
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 60,
  padding: "16px",
};

const cardStyle: CSSProperties = {
  position: "relative",
  background: borderBg(MODAL_BORDER_SVG),
  padding: "36px 36px 30px",
  width: "520px",
  maxWidth: "94vw",
  maxHeight: "92vh",
  overflowY: "auto",
  boxSizing: "border-box",
};

function getOrdinal(day: string | number): string {
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

export function BookingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  error,
  slotInfo,
  modeInfo,
  userInfo,
}: BookingConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={overlayStyle}
      onClick={isSubmitting ? undefined : onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Confirm Mission Reservation"
    >
      <div
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col gap-5 text-white"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          aria-label="Close modal"
          className="absolute top-4 right-5 text-white/60 hover:text-white font-mono text-xl cursor-pointer transition-colors p-1 disabled:opacity-40"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="inline-block px-3 py-1 bg-[#FEDC02]/15 border border-[#FEDC02]/50 text-[#FEDC02] text-[10px] font-mono tracking-widest uppercase rounded mb-2">
            STEP 3 OF 4: MISSION CONFIRMATION
          </div>
          <h2
            className="font-pixel text-xl sm:text-2xl text-[#FEDC02] tracking-wider uppercase m-0"
            style={{ textShadow: "-2px 0 0 #E5349E" }}
          >
            CONFIRM ARENA SLOT
          </h2>
          <p className="font-mono text-xs text-white/70 mt-1 uppercase tracking-wider">
            Review your combat deployment details before ticketing
          </p>
        </div>

        {/* Mission Details Box */}
        <div className="bg-[#0e0e18] border border-white/20 rounded-lg p-4 flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-white/60 tracking-wider">DEPLOYMENT DATE</span>
            <span className="text-[#00F0FF] font-bold text-sm">
              {slotInfo.day}
              {getOrdinal(slotInfo.day)} {slotInfo.month.toUpperCase()} 2026
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-white/60 tracking-wider">ARENA TIME SLOT</span>
            <span className="text-[#FEDC02] font-bold text-sm">
              {slotInfo.time}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-white/60 tracking-wider">COMBAT MODE</span>
            <span className="text-[#E5349E] font-bold">
              {modeInfo.type === "team"
                ? `TEAM MISSION ${modeInfo.teamName ? `(${modeInfo.teamName})` : ""} [${modeInfo.teamCode || ""}]`
                : "SOLO RECON"}
            </span>
          </div>

          {userInfo?.name && (
            <div className="flex items-center justify-between">
              <span className="text-white/60 tracking-wider">OPERATIVE</span>
              <span className="text-white font-medium truncate max-w-[220px]">
                {userInfo.name} {userInfo.email ? `(${userInfo.email})` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Informative Notice */}
        <div className="flex items-start gap-2 bg-[#0c1322] border border-[#00F0FF]/30 p-3 rounded-lg text-white/80 font-mono text-[11px] leading-relaxed">
          <span className="text-[#00F0FF] text-base leading-none">⚡</span>
          <span>
            Upon confirmation, your slot will be officially secured in the arena schedule. Your unique QR Pass will be minted and emailed to you.
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-950/80 border border-red-500/80 text-red-200 text-xs font-mono p-3 rounded text-center">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-1/2 py-3 px-4 border border-white/30 text-white/80 hover:text-white hover:border-white font-pixel text-xs rounded transition-colors uppercase tracking-wider cursor-pointer disabled:opacity-50"
          >
            ← Change Slot
          </button>

          <div className="w-full sm:w-1/2">
            <PixelButton
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              label={isSubmitting ? "SECURING PASS..." : "CONFIRM & ISSUE PASS"}
              interaction="hero"
              className="w-full"
              labelClassName="text-xs cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
