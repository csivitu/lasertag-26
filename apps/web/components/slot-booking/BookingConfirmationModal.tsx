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
  background: "rgba(0, 0, 0, 0.88)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 60,
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
}: BookingConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div
      style={overlayStyle}
      onClick={isSubmitting ? undefined : onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Confirm Arena Slot"
    >
      <div
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
        className="text-white text-center flex flex-col items-center"
      >
        {/* Modal Title */}
        <h2
          className="font-pixel text-base sm:text-lg text-[#FEDC02] uppercase tracking-wider mb-6 leading-relaxed"
          style={{ textShadow: "-2px 0 0 #E5349E, 2px 2px 0 rgba(0,0,0,0.8)" }}
        >
          Confirm Arena Slot
        </h2>

        {/* Slot summary only */}
        <p className="font-pixel text-xs sm:text-sm text-white tracking-[0.1em] uppercase mb-8">
          {slotInfo.day}
          {getOrdinal(slotInfo.day)} {slotInfo.month.toUpperCase()} 2026 |{" "}
          {slotInfo.time}
        </p>

        {/* Error message */}
        {error && (
          <div className="w-full bg-red-950/80 border border-red-500/80 text-red-200 text-xs font-mono p-3 rounded text-center mb-4">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full flex flex-col items-center gap-4 pt-3">
          <PixelButton
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            label={isSubmitting ? "SECURING PASS..." : "CONFIRM SLOT"}
            interaction="hero"
            className="w-full sm:w-auto min-w-[240px]"
          />
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer font-pixel text-[11px] tracking-[0.1em] text-white/60 transition-colors hover:text-white disabled:opacity-50"
          >
            ← Change Slot
          </button>
        </div>
      </div>
    </div>
  );
}
