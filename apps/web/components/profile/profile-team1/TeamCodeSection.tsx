"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export function TeamCodeSection() {
  const [teamCode, setTeamCode] = useState<string | null>("CUDHEF");

  useEffect(() => {
    let mounted = true;
    async function fetchTeam() {
      try {
        const res = await fetch('/api/profile/team');
        if (!res.ok) return;
        const json = await res.json();
        if (mounted && json?.data?.team_code) setTeamCode(json.data.team_code);
      } catch (e) {
        // ignore
      }
    }
    fetchTeam();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex flex-col items-center justify-between h-full py-4 sm:py-6 px-2 sm:px-4 select-none translate-x-6">
      {/* Header: TEAM CODE */}
      <div className="flex flex-col items-center gap-7">
        <div className="relative w-32 sm:w-50 aspect-[210/21]">
          <Image
            src="/profile/profile-team1/TEAM CODE.svg"
            alt="TEAM CODE"
            fill
            className="object-contain"
          />
        </div>
        <div className="relative w-20 sm:w-24 aspect-[94/14] flex items-center justify-center">
          <span className="text-white text-lg sm:text-2xl tracking-widest">{teamCode}</span>
        </div>
      </div>

      {/* Retro Arcade Machine Graphic */}
      <div className="relative w-36 h-36 sm:w-44 sm:h-44 my-auto shrink-0 translate-x-2">
        <Image
          src="/profile/profile-team1/Group 13.svg"
          alt="LASERTAG Arcade"
          fill
          className="object-contain"
        />
      </div>

      {/* Action Button: BOOK SLOT */}
      <button
        type="button"
        className="relative w-full max-w-[170px] sm:max-w-[190px] aspect-[225/63] hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer focus:outline-none translate-x-1"
      >
        <Image
          src="/profile/profile-team1/Group 611.svg"
          alt="BOOK SLOT"
          fill
          className="object-contain"
        />
      </button>
    </div>
  );
}
