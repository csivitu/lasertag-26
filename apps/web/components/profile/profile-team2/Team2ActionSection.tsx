"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { QrCode } from "../profile-solo/QrCode";

export function Team2ActionSection() {
  const router = useRouter();
  const { profile } = useUserProfile();
  const [copied, setCopied] = useState(false);

  const teamCode = profile?.team?.teamCode || "TEAM";

  const handleCopyCode = () => {
    if (teamCode && teamCode !== "TEAM") {
      navigator.clipboard.writeText(teamCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full py-4 px-3 select-none gap-3">
      {/* SCAN TO PLAY Title */}
      <h3
        className="text-[#23eff1] font-mono font-bold text-xs tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        SCAN PASS TO ENTER
      </h3>

      {/* Dynamic QR Code Container */}
      <div className="relative p-2 bg-white rounded-md shadow-lg border-2 border-black">
        <QrCode className="w-24 h-24 sm:w-28 sm:h-28" />
      </div>

      {/* Team Code Display / Share Box */}
      <div className="w-full bg-[#11111b] border border-[#00F0FF]/60 rounded p-2 text-center flex flex-col items-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.15)]">
        <div className="flex items-center justify-center gap-2">
          <span className="font-pixel text-xs text-[#00F0FF] font-bold tracking-widest">
            {teamCode}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="font-pixel text-[8px] px-1.5 py-0.5 bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF] rounded hover:bg-[#00F0FF] hover:text-black transition-all cursor-pointer"
          >
            {copied ? "COPIED!" : "COPY"}
          </button>
        </div>
        <span className="font-pixel text-[7px] text-white/50 uppercase">
          {profile?.team?.memberCount || 1}/5 Operatives Joined
        </span>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => router.push("/slot-booking")}
        className="w-full max-w-[160px] py-1.5 px-2 bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 text-[#00F0FF] text-[9px] font-bold rounded border border-[#00F0FF] transition-all uppercase tracking-wider text-center cursor-pointer"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        ARENA SLOTS
      </button>
    </div>
  );
}
