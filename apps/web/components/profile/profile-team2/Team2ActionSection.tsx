"use client";

import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { QrCode } from "../profile-solo/QrCode";

export function Team2ActionSection() {
  const router = useRouter();
  const { profile } = useUserProfile();

  const slotDate = profile?.activeRegistration?.slot?.slotDate || "NOT BOOKED";
  const slotTime = profile?.activeRegistration?.slot?.slotTime || "STANDBY";
  const teamCode = profile?.team?.teamCode || "TEAM";

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

      {/* 2. TEAM CODE */}
      <div className="flex flex-col items-center gap-1 my-2 text-center">
        <span className="font-pixel text-[10px] sm:text-xs text-[#00F0FF] tracking-wider uppercase">
          TEAM CODE
        </span>
        <div className="font-pixel text-base sm:text-xl text-[#FEDC02] tracking-[0.2em] border-2 border-[#FEDC02] px-3 py-0.5 bg-[#161622] rounded select-text">
          {teamCode}
        </div>
      </div>

      {/* 3. SCAN & QR CODE */}
      <div className="flex flex-col items-center gap-1.5 my-1">
        <span className="font-pixel text-[9px] sm:text-[10px] text-[#FEDC02] tracking-wider uppercase">
          SCAN TO ENTER
        </span>
        <div className="relative w-18 h-18 sm:w-22 sm:h-22 bg-white p-1.5 rounded shadow-md border-2 border-black">
          <QrCode className="w-full h-full" />
        </div>
      </div>

      {/* 4. SWITCH / REGISTER BUTTON */}
      <button
        type="button"
        onClick={() => router.push("/register")}
        className="w-full max-w-[150px] py-2 px-3 bg-[#E5349E] hover:bg-[#ff4db7] text-white font-pixel text-[9px] sm:text-[10px] rounded border-2 border-[#ff7beb] shadow-[0_3px_0_#9c187d] transition-all hover:scale-102 active:translate-y-[1px] uppercase tracking-wider text-center cursor-pointer mt-1"
      >
        SWITCH TEAM
      </button>
    </div>
  );
}
