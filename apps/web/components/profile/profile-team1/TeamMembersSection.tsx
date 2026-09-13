"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const badges = [
  "/profile/profile-team1/Group 756.svg",
  "/profile/profile-team1/Group 756 (1).svg",
  "/profile/profile-team1/Group 756 (2).svg",
  "/profile/profile-team1/Group 756 (3).svg",
  "/profile/profile-team1/Group 756 (4).svg",
];

type Member = { name: string; regNo: string };

export function TeamMembersSection() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchTeam() {
      try {
        const res = await fetch('/api/profile/team');
        if (!res.ok) return;
        const json = await res.json();
        if (mounted && json?.data?.members) {
          setMembers(json.data.members);
        }
      } catch (e) {
        // ignore, keep empty
      }
    }

    fetchTeam();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="flex flex-col justify-between h-full py-3 sm:py-5 px-3 sm:px-5">
      {/* Header Wordmark: TEAM MEMBERS */}
      <div className="mb-2 sm:mb-3">
        <div className="relative w-48 sm:w-60 aspect-[326/25]">
          <Image
            src="/profile/profile-team1/TEAM MEMBERS.svg"
            alt="TEAM MEMBERS"
            fill
            className="object-contain object-left"
          />
        </div>
      </div>

     {/* 5 Team Member Rows */}
<div className="flex flex-col justify-between flex-1">
  {members.length > 0 ? (
    members.map((m, idx) => (
      <div key={m.regNo || idx} className="flex items-center gap-2 sm:gap-3">
        <div className="relative w-9 h-7 sm:w-11 sm:h-8 shrink-0">
          <Image src={badges[idx] || badges[0]} alt={String(idx + 1)} fill className="object-contain" />
        </div>

        <div className="flex flex-col">
          <div className="text-white text-sm sm:text-base truncate">{m.name}</div>
          <div className="text-gray-300 text-xs sm:text-sm truncate">{m.regNo}</div>
        </div>
      </div>
    ))
  ) : (
    // fallback to static placeholders when no data
    badges.map((badge, i) => (
      <div key={i} className="flex items-center gap-2 sm:gap-3">
        <div className="relative w-9 h-7 sm:w-11 sm:h-8 shrink-0">
          <Image src={badge} alt={String(i + 1)} fill className="object-contain" />
        </div>
        <div className="relative h-7 sm:h-8 w-36 sm:w-44">
          <Image src="/profile/profile-team1/Group 757.svg" alt="Member" fill className="object-contain object-left" />
        </div>
      </div>
    ))
  )}
</div>
    </div>
  );
}
