"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Starfield } from "../hero/Starfield";
import { HeroHeader } from "../hero/HeroHeader";
import { PixelButton } from "../hero/PixelButton";
import { MODAL_BORDER_SVG, borderBg } from "../mode-popup/modePopupDecor";

interface ActiveModeDetailsProps {
  mode: "solo" | "team";
  teamInfo?: {
    teamCode?: string;
    teamName?: string;
    isLeader?: boolean;
    memberCount?: number;
    members?: Array<{ id: string; name: string; email: string; isLeader?: boolean }>;
  } | null;
  slotInfo?: {
    dateStr?: string;
    timeStr?: string;
  } | null;
  userInfo?: {
    name?: string;
    email?: string;
  } | null;
  onChangeMode: () => void;
}

function formatSlotDate(dateStr?: string): string {
  if (!dateStr) return "";
  const match = dateStr.match(/\b(18|19|20)\b/);
  if (match) {
    return `${match[1]}th Sep 2026`;
  }
  return dateStr.replace(/December/gi, "Sep").replace(/th SEP 2026/gi, " Sep 2026");
}

export function ActiveModeDetails({
  mode,
  teamInfo,
  slotInfo,
  userInfo,
  onChangeMode,
}: ActiveModeDetailsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const teamCode = teamInfo?.teamCode;
  const isLeader = teamInfo?.isLeader ?? true;

  const handleCopyCode = () => {
    if (teamCode) {
      navigator.clipboard.writeText(teamCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmReset = () => {
    // Clear storage artifacts
    try {
      localStorage.removeItem("lasertag_selected_mode");
      sessionStorage.removeItem("lasertag_selected_mode");
      localStorage.removeItem("lasertag_active_team");
      sessionStorage.removeItem("lasertag_active_team");
      localStorage.removeItem("lasertag_onboarding_solo");
      sessionStorage.removeItem("lasertag_onboarding_solo");
      localStorage.removeItem("lasertag_confirmed_slot");
      sessionStorage.setItem("lasertag_confirmed_slot", "");
    } catch {
      // ignore
    }
    setConfirmOpen(false);
    onChangeMode();
  };

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#08080d] flex flex-col justify-between font-pixel pb-12 select-none">
      {/* Background */}
      <Starfield />

      {/* Retro Navigation Header */}
      <HeroHeader />

      {/* Main Container */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center px-4 py-8 max-w-4xl mx-auto w-full">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/50 text-[#00F0FF] text-[10px] tracking-widest uppercase mb-3 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF]"></span>
            MISSION PROTOCOL ACTIVE
          </div>
          <h1
            className="font-heading text-2xl sm:text-4xl text-[#FEDC02] uppercase tracking-wider"
            style={{ textShadow: "-2px 0 0 #E5349E, 2px 2px 0 rgba(0,0,0,0.8)" }}
          >
            {mode === "team" ? "SQUAD BATTLE INTEL" : "SOLO RECON INTEL"}
          </h1>
          <p className="font-pixel text-xs text-white/70 mt-1 max-w-md mx-auto">
            CURRENT ARENA REGISTRATION & DEPLOYMENT SPECIFICATIONS
          </p>
        </div>

        {/* Cyberpunk Arcade Card */}
        <div
          style={{
            position: "relative",
            background: borderBg(MODAL_BORDER_SVG),
            padding: "32px 28px",
            width: "100%",
            maxWidth: "680px",
            boxSizing: "border-box",
          }}
          className="text-white shadow-[0_0_50px_rgba(0,240,255,0.15)]"
        >
          {/* Top Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/15 mb-6">
            <div>
              <span className="text-[10px] text-white/50 tracking-widest uppercase block">
                COMBAT PROTOCOL
              </span>
              <span
                className="font-heading text-xl text-white"
                style={{
                  color: mode === "team" ? "#E5349E" : "#00F0FF",
                  textShadow: `0 0 10px ${mode === "team" ? "rgba(229,52,158,0.5)" : "rgba(0,240,255,0.5)"}`,
                }}
              >
                {mode === "team" ? "TEAM SQUAD PROTOCOL" : "SOLO RECON PROTOCOL"}
              </span>
            </div>

            <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1 rounded bg-[#FEDC02]/10 border border-[#FEDC02]/40 text-[#FEDC02] text-[10px]">
              {mode === "team"
                ? isLeader
                  ? "⭐ SQUAD COMMANDER"
                  : "🛡️ SQUAD OPERATIVE"
                : "⚡ SOLO AGENT"}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Operative Card */}
            <div className="bg-[#12111f]/90 border border-white/10 rounded-lg p-3.5">
              <span className="text-[10px] text-white/50 tracking-widest uppercase block mb-1">
                OPERATIVE DETAILS
              </span>
              <div className="text-white font-bold text-xs truncate">
                {userInfo?.name || "AUTHENTICATED AGENT"}
              </div>
              <div className="text-white/60 text-[10px] font-mono truncate mt-0.5">
                {userInfo?.email || "ID SECURED"}
              </div>
            </div>

            {/* Team or Solo Card */}
            {mode === "team" ? (
              <div className="bg-[#12111f]/90 border border-[#E5349E]/30 rounded-lg p-3.5">
                <span className="text-[10px] text-[#E5349E] tracking-widest uppercase block mb-1">
                  SQUAD NAME & CODE
                </span>
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate">
                    <span className="text-white font-bold text-xs block truncate">
                      {teamInfo?.teamName || `SQUAD ${teamCode || ""}`}
                    </span>
                    <span className="font-mono text-[11px] text-[#FEDC02] tracking-wider font-bold">
                      CODE: {teamCode || "PENDING"}
                    </span>
                  </div>
                  {teamCode && (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="shrink-0 px-2.5 py-1 text-[9px] font-pixel rounded bg-[#E5349E]/20 hover:bg-[#E5349E]/40 text-[#E5349E] border border-[#E5349E] transition-all cursor-pointer"
                    >
                      {copied ? "✓ COPIED" : "📋 COPY"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#12111f]/90 border border-[#00F0FF]/30 rounded-lg p-3.5">
                <span className="text-[10px] text-[#00F0FF] tracking-widest uppercase block mb-1">
                  TACTICAL DEPLOYMENT
                </span>
                <div className="text-white font-bold text-xs">SOLO RUNNER</div>
                <div className="text-white/60 text-[10px] font-mono mt-0.5">
                  1-V-ALL ARENA BATTLE
                </div>
              </div>
            )}
          </div>

          {/* Reserved Slot Banner - Clean layout without the blue button */}
          <div className="bg-[#12111f]/90 border-2 border-[#FEDC02]/60 rounded-xl p-4 mb-6 shadow-[0_0_20px_rgba(254,220,2,0.15)]">
            <span className="text-[10px] text-[#FEDC02] tracking-widest uppercase block mb-1.5 font-pixel">
              MISSION TIME SLOT
            </span>
            {slotInfo?.dateStr ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎟️</span>
                <div>
                  <div className="text-white font-bold text-sm tracking-wide">
                    {formatSlotDate(slotInfo.dateStr)}
                  </div>
                  <div className="text-[#00F0FF] font-mono text-xs font-semibold mt-0.5">
                    {slotInfo.timeStr}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <div className="text-white font-bold text-xs">
                    NO ARENA SLOT SECURED YET
                  </div>
                  <div className="text-white/60 text-[10px] font-mono mt-0.5">
                    Pick your deployment slot to mint your pass.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Row - All buttons styled in matching pink PixelButton theme */}
          {slotInfo?.dateStr ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 w-full">
              <PixelButton
                label="CHANGE COMBAT MODE"
                onClick={() => setConfirmOpen(true)}
                className="w-full"
                labelClassName="text-[10px] sm:text-[9px] md:text-[10px] whitespace-nowrap"
                interaction="hero"
              />
              <PixelButton
                label="CHANGE SLOT"
                onClick={() => router.push("/slot-booking")}
                className="w-full"
                labelClassName="text-[10px] sm:text-[9px] md:text-[10px] whitespace-nowrap"
                interaction="hero"
              />
              <PixelButton
                label="YOUR DIGITAL PASS →"
                onClick={() => router.push("/profile")}
                className="w-full"
                labelClassName="text-[10px] sm:text-[9px] md:text-[10px] whitespace-nowrap"
                interaction="hero"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 w-full">
              <PixelButton
                label="CHANGE COMBAT MODE"
                onClick={() => setConfirmOpen(true)}
                className="w-full"
                labelClassName="text-[10px] sm:text-[9px] md:text-[10px] whitespace-nowrap"
                interaction="hero"
              />
              <PixelButton
                label="PROCEED TO SLOT BOOKING →"
                onClick={() => router.push("/slot-booking")}
                className="w-full"
                labelClassName="text-[10px] sm:text-[9px] md:text-[10px] whitespace-nowrap"
                interaction="hero"
              />
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Change Combat Mode */}
      {confirmOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: borderBg(MODAL_BORDER_SVG),
              padding: "32px 24px",
              width: "480px",
              maxWidth: "94vw",
            }}
            className="text-white text-center flex flex-col items-center"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-xl mb-3 text-red-500">
              ⚠️
            </div>

            <h3 className="font-heading text-lg sm:text-xl text-[#FEDC02] uppercase tracking-wider mb-2">
              CONFIRM MODE RESET
            </h3>

            <p className="font-pixel text-[11px] text-white/80 leading-relaxed mb-6 max-w-sm">
              Are you sure you want to change your combat mode? This will reset your current
              {mode === "team" ? ` squad (${teamCode || ""})` : " solo protocol"} and allow you to select a new squad or solo mode.
            </p>

            <div className="flex gap-3 w-full justify-center">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-5 py-2.5 rounded bg-white/10 hover:bg-white/20 text-white font-pixel text-xs transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-5 py-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-pixel text-xs font-bold transition-colors cursor-pointer shadow-[0_2px_0_#990000]"
              >
                RESET & SELECT NEW MODE
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
