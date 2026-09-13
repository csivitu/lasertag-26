"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function Team2ActionSection() {
  const [teamCode, setTeamCode] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [timeslot, setTimeslot] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchTeam() {
      try {
        const res = await fetch('/api/profile/team');
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setTeamCode(json?.data?.team_code ?? null);
        setDate(json?.data?.date ?? null);
        setTimeslot(json?.data?.timeslot ?? null);
      } catch (e) {
        // ignore
      }
    }
    fetchTeam();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex flex-col items-center justify-between h-full py-2.5 sm:py-3.5 px-2 select-none">
      {/* 1. SLOT & DATE/TIME */}
      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
        <div className="relative w-16 sm:w-25 aspect-[93/21] translate-y-2 translate-x-5">
          <Image src="/profile/profile-team2/SLOT.svg" alt="SLOT" fill className="object-contain" />
        </div>
        <div className="translate-y-7 translate-x-5 text-center">
          <div className="text-white text-sm sm:text-base">{date ?? "19 SEPT 2026"}</div>
          <div className="text-gray-300 text-xs sm:text-sm">{timeslot ?? "10:00 - 10:15 AM"}</div>
        </div>
      </div>

      {/* 2. TEAM CODE */}
      <div className="flex flex-col items-center gap-0.5 sm:gap-1 my-1 ">
        <div className="relative w-24 sm:w-50 aspect-[210/21] translate-x-5">
          <Image src="/profile/profile-team2/TEAM CODE (1).svg" alt="TEAM CODE" fill className="object-contain" />
        </div>
        <div className="relative w-16 sm:w-30 aspect-[94/14] translate-y-5 translate-x-5 flex items-center justify-center">
          <span className="text-white text-lg sm:text-xl tracking-widest">{teamCode ?? "CUDHEF"}</span>
        </div>
      </div>

      {/* 3. SCAN & QR CODE */}
      <div className="flex flex-col items-center gap-1 my-0.5">
        <div className="relative w-12 sm:w-30 aspect-[93/21] translate-y-0 translate-x-5">
          <Image
            src="/profile/profile-team2/SCAN.svg"
            alt="SCAN"
            fill
            className="object-contain"
          />
        </div>
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white p-1 rounded-sm shadow-md translate-y-3 translate-x-5">
          <Image
            src="/profile/profile-team2/image 129.svg"
            alt="QR Code"
            fill
            className="object-contain p-1"
          />
        </div>
      </div>

      {/* 4. CHANGE TEAM BUTTON */}
      <button
        type="button"
        className="relative w-full max-w-[140px] sm:max-w-[160px] aspect-[244/49] hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer focus:outline-none mt-1 translate-x-6"
      >
        <Image
          src="/profile/profile-team2/Group 611 (1).svg"
          alt="CHANGE TEAM"
          fill
          className="object-contain"
        />
      </button>
    </div>
  );
}
