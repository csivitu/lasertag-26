"use client";

import Image from "next/image";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSession } from "@/lib/auth-client";

const SLOT_BADGES = [
  { badge: "/profile/profile-team1/Group 756.svg", num: "01" },
  { badge: "/profile/profile-team1/Group 756 (1).svg", num: "02" },
  { badge: "/profile/profile-team1/Group 756 (2).svg", num: "03" },
  { badge: "/profile/profile-team1/Group 756 (3).svg", num: "04" },
  { badge: "/profile/profile-team1/Group 756 (4).svg", num: "05" },
];

export function TeamMembersSection() {
  const { data: session } = useSession();
  const { profile } = useUserProfile();

  // If DB returns members, use them. If leader exists but members array hasn't synced, fallback to leader as member 1
  let membersList = profile?.team?.members || [];
  if (membersList.length === 0 && session?.user) {
    membersList = [
      {
        id: session.user.id,
        name: session.user.name || "LEADER",
        email: session.user.email || "",
        phone: null,
        isLeader: true,
      },
    ];
  }

  const memberCount = Math.max(membersList.length, profile?.team?.memberCount || 1);

  return (
    <div className="flex flex-col justify-between h-full py-3 sm:py-5 px-3 sm:px-5 select-none overflow-hidden">
      {/* Header Wordmark: TEAM MEMBERS & Capacity Counter */}
      <div className="mb-2 sm:mb-3 flex items-center justify-between gap-2">
        <div className="relative w-32 sm:w-40 aspect-[326/25] shrink-0">
          <Image
            src="/profile/profile-team1/TEAM MEMBERS.svg"
            alt="TEAM MEMBERS"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
        <span className="font-pixel text-[9px] sm:text-[10px] text-[#FEDC02] tracking-wider uppercase px-2 py-0.5 bg-[#FEDC02]/10 border border-[#FEDC02]/40 rounded shrink-0 whitespace-nowrap">
          {memberCount} / 5
        </span>
      </div>

      {/* Up to MAX 5 Team Member Rows */}
      <div className="flex flex-col justify-between flex-1 gap-2 min-h-0">
        {SLOT_BADGES.map((m, idx) => {
          const member = membersList[idx];
          const isFilled = Boolean(member);

          return (
            <div
              key={m.num}
              className="flex items-center gap-2 sm:gap-3"
            >
              {/* Number badge (01 - 05) */}
              <div className="relative w-8 h-6 sm:w-14 sm:h-8 shrink-0">
                <Image
                  src={m.badge}
                  alt={m.num}
                  fill
                  className="object-contain"
                />
              </div>

              {/* Dynamic Member Name or Open Slot from DB */}
              <div
                className={`flex items-center px-2.5 sm:px-3.5 py-1.5 border rounded text-left min-w-0 flex-1 ${
                  isFilled
                    ? "bg-[#161626] border-[#00F0FF]/60 text-white shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                    : "bg-[#0f0f18]/60 border-dashed border-white/25 text-white/40"
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 truncate w-full">
                  <span
                    className={`font-pixel text-[10px] sm:text-[12px] tracking-wider uppercase truncate ${
                      isFilled ? "text-white" : "text-white/40"
                    }`}
                  >
                    {isFilled ? member.name : `[OPEN SLOT ${m.num}]`}
                  </span>

                  {isFilled && member.isLeader && (
                    <span className="font-pixel text-[8px] sm:text-[9px] px-1 py-0.2 bg-[#FEDC02] text-black font-bold rounded shrink-0">
                      LEADER
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
