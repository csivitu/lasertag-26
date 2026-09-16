"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { MODAL_BORDER_SVG, borderBg } from "../mode-popup/modePopupDecor";
import { PixelButton } from "../hero/PixelButton";
import type { SlotSideInfo } from "@/hooks/useSlots";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (side: "red" | "blue") => void;
  isSubmitting: boolean;
  error: string | null;
  slotInfo: {
    day: string;
    month: string;
    time: string;
    red: SlotSideInfo;
    blue: SlotSideInfo;
  };
  modeInfo: {
    type: "individual" | "team";
    teamName?: string;
    teamCode?: string;
    memberCount?: number;
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
  width: "560px",
  maxWidth: "96vw",
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
  // Pick default side based on availability
  const defaultSide: "red" | "blue" =
    slotInfo.red.available >= (modeInfo.type === "team" ? (modeInfo.memberCount ?? 1) : 1)
      ? "red"
      : "blue";

  const [selectedSide, setSelectedSide] = useState<"red" | "blue">(defaultSide);
  const [squadWarningAcknowledged, setSquadWarningAcknowledged] = useState(false);

  if (!isOpen) return null;

  const partySize = modeInfo.type === "team" ? (modeInfo.memberCount ?? 1) : 1;
  const isSquadIncomplete = modeInfo.type === "team" && partySize < 5;

  const redCanFit = slotInfo.red.available >= partySize;
  const blueCanFit = slotInfo.blue.available >= partySize;

  const handleConfirmClick = () => {
    onConfirm(selectedSide);
  };

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
            5v5 ARENA COMBAT ASSIGNMENT
          </div>
          <h2
            className="font-pixel text-xl sm:text-2xl text-[#FEDC02] tracking-wider uppercase m-0"
            style={{ textShadow: "-2px 0 0 #E5349E" }}
          >
            CONFIRM ARENA SLOT
          </h2>
          <p className="font-mono text-xs text-white/70 mt-1 uppercase tracking-wider">
            Review side vacancy & deployment details before securing pass
          </p>
        </div>

        {/* SQUAD MEMBER POPUP WARNING */}
        {isSquadIncomplete && !squadWarningAcknowledged && (
          <div className="bg-[#241103] border-2 border-[#FF7B00] rounded-lg p-4 flex flex-col gap-2.5 shadow-[0_0_20px_rgba(255,123,0,0.3)]">
            <div className="flex items-center gap-2 text-[#FF7B00] font-pixel text-xs font-bold">
              <span>⚠️</span>
              <span>INCOMPLETE SQUAD WARNING ({partySize} / 5 MEMBERS)</span>
            </div>
            <p className="font-mono text-xs text-amber-200 leading-relaxed">
              Only proceed to confirm slot when all your team members have joined!
              Currently your squad has <strong>{partySize} out of 5</strong> members.
              Once confirmed, your slot will be locked and confirmation passes will be dispatched.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-white/40 text-white/80 hover:text-white font-pixel text-[10px] rounded uppercase cursor-pointer"
              >
                Wait For Teammates
              </button>
              <button
                type="button"
                onClick={() => setSquadWarningAcknowledged(true)}
                className="px-3 py-1.5 bg-[#FF7B00] text-black font-pixel text-[10px] font-bold rounded uppercase cursor-pointer hover:bg-[#ff9433]"
              >
                Proceed With {partySize} Members →
              </button>
            </div>
          </div>
        )}

        {/* 5v5 Side Selection & Vacancy Breakdown */}
        <div className="flex flex-col gap-2">
          <label className="font-pixel text-[10px] text-white/80 uppercase tracking-wider">
            CHOOSE COMBAT FACTION / SIDE (5 vs 5 ARENA):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* RED SIDE CARD */}
            <button
              type="button"
              onClick={() => setSelectedSide("red")}
              disabled={!redCanFit || isSubmitting}
              className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedSide === "red"
                  ? "border-[#FF0055] bg-[#FF0055]/20 shadow-[0_0_15px_rgba(255,0,85,0.4)]"
                  : "border-white/20 bg-[#12080f] hover:border-[#FF0055]/60"
              } ${!redCanFit ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-pixel text-xs text-[#FF0055] font-bold tracking-wider">
                  RED SIDE {selectedSide === "red" && "✓"}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#FF0055]/30 text-white">
                  {slotInfo.red.occupied}/5 Filled
                </span>
              </div>
              <p className="font-mono text-[11px] text-white/80">
                {slotInfo.red.needed === 0
                  ? "Side is completely full"
                  : `${slotInfo.red.needed} logo ki kami hai (${slotInfo.red.available} slots free)`}
              </p>
            </button>

            {/* BLUE SIDE CARD */}
            <button
              type="button"
              onClick={() => setSelectedSide("blue")}
              disabled={!blueCanFit || isSubmitting}
              className={`p-3 rounded-lg border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedSide === "blue"
                  ? "border-[#00F0FF] bg-[#00F0FF]/20 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                  : "border-white/20 bg-[#081216] hover:border-[#00F0FF]/60"
              } ${!blueCanFit ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-pixel text-xs text-[#00F0FF] font-bold tracking-wider">
                  BLUE SIDE {selectedSide === "blue" && "✓"}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#00F0FF]/30 text-white">
                  {slotInfo.blue.occupied}/5 Filled
                </span>
              </div>
              <p className="font-mono text-[11px] text-white/80">
                {slotInfo.blue.needed === 0
                  ? "Side is completely full"
                  : `${slotInfo.blue.needed} logo ki kami hai (${slotInfo.blue.available} slots free)`}
              </p>
            </button>
          </div>
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
            <span className="text-white/60 tracking-wider">DEPLOYMENT SQUAD</span>
            <span className="text-[#E5349E] font-bold">
              {modeInfo.type === "team"
                ? `TEAM ${modeInfo.teamName ? `\"${modeInfo.teamName}\"` : ""} [${modeInfo.teamCode || ""}] (${partySize} Operatives)`
                : "SOLO RECON (1 Operative)"}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-white/60 tracking-wider">SELECTED FACTION</span>
            <span className={`font-bold uppercase ${selectedSide === "red" ? "text-[#FF0055]" : "text-[#00F0FF]"}`}>
              {selectedSide.toUpperCase()} TEAM
            </span>
          </div>

          {userInfo?.name && (
            <div className="flex items-center justify-between">
              <span className="text-white/60 tracking-wider">BOOKING OPERATIVE</span>
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
            Upon confirmation, individual verifiable Battle Pass QR codes and passes will be emailed to all {partySize} operative(s) in this booking.
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
              onClick={handleConfirmClick}
              disabled={isSubmitting || (isSquadIncomplete && !squadWarningAcknowledged)}
              label={isSubmitting ? "SECURING PASS..." : "CONFIRM & DISPATCH"}
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
