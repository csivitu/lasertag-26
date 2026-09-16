"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { QrCode } from "../profile-solo/QrCode";

function formatSlotDate(dateStr?: string): string {
  if (!dateStr) return "";
  const match = dateStr.match(/\b(18|19|20)\b/);
  if (match) {
    return `${match[1]}th Sep 2026`;
  }
  return dateStr.replace(/December/gi, "Sep").replace(/th SEP 2026/gi, " Sep 2026");
}

export function Team2ActionSection() {
  const router = useRouter();
  const { profile } = useUserProfile();
  const [copied, setCopied] = useState(false);

  // Fallback to local storage if profile slot is still hydrating
  let storedSlot: { day?: string | number; month?: string; time?: string } | null = null;
  if (typeof window !== "undefined") {
    try {
      const raw =
        localStorage.getItem("lasertag_confirmed_slot") ||
        sessionStorage.getItem("lasertag_confirmed_slot");
      if (raw) storedSlot = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  const rawSlotDate =
    profile?.activeRegistration?.slot?.slotDate ||
    (storedSlot?.day ? `${storedSlot.day}th ${storedSlot.month || "SEP"} 2026` : "18th Sep 2026");
  const slotDate = formatSlotDate(rawSlotDate);
  const slotTime = profile?.activeRegistration?.slot?.slotTime || storedSlot?.time || "STANDBY";
  const teamCode = profile?.team?.teamCode || "TEAM";

  const handleCopyCode = () => {
    if (teamCode && teamCode !== "TEAM") {
      navigator.clipboard.writeText(teamCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full py-2.5 sm:py-3.5 px-2 select-none">
      {/* 1. SLOT & DATE/TIME */}
      <div className="flex flex-col items-center gap-1 text-center w-full">
        <span className="font-pixel text-[10px] sm:text-xs text-[#00F0FF] tracking-wider uppercase">
          BATTLE SLOT
        </span>
        <div className="font-pixel text-[10px] sm:text-[11px] text-white/90 bg-[#141422] border border-[#00F0FF]/40 rounded px-2.5 py-1 tracking-wider">
          {slotDate}
          <div className="text-[#FEDC02] text-[9px] mt-0.5">{slotTime}</div>
        </div>
      </div>

      {/* 2. TEAM CODE + COPY BUTTON */}
      <div className="flex flex-col items-center gap-1 my-1.5 text-center">
        <span className="font-pixel text-[10px] sm:text-xs text-[#00F0FF] tracking-wider uppercase">
          TEAM CODE
        </span>
        <div className="flex items-center gap-1.5">
          <div className="font-pixel text-base sm:text-lg text-[#FEDC02] tracking-[0.2em] border-2 border-[#FEDC02] px-2.5 py-0.5 bg-[#161622] rounded select-text">
            {teamCode}
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="px-2 py-1 bg-[#FEDC02]/20 hover:bg-[#FEDC02]/40 text-[#FEDC02] border border-[#FEDC02] text-[9px] font-pixel rounded cursor-pointer transition-all"
            title="Copy Team Code"
          >
            {copied ? "✓" : "📋"}
          </button>
        </div>
      </div>

      {/* 3. SCAN & QR CODE */}
      <div className="flex flex-col items-center gap-1 my-1">
        <span className="font-pixel text-[9px] sm:text-[10px] text-[#FEDC02] tracking-wider uppercase">
          SCAN TO ENTER
        </span>
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white p-1.5 rounded shadow-md border-2 border-black">
          <QrCode className="w-full h-full" />
        </div>
      </div>

      {/* 4. SWITCH / REGISTER BUTTON */}
      <button
        type="button"
        onClick={() => router.push("/select-mode")}
        className="w-full max-w-[150px] py-1.5 px-3 bg-[#E5349E] hover:bg-[#ff4db7] text-white font-pixel text-[9px] sm:text-[10px] rounded border-2 border-[#ff7beb] shadow-[0_3px_0_#9c187d] transition-all hover:scale-102 active:translate-y-[1px] uppercase tracking-wider text-center cursor-pointer mt-1"
      >
        CHANGE MODE / TEAM
      </button>
    </div>
  );
}
