"use client";

import Image from "next/image";
import { PassDetailItem } from "../shared/PassDetailItem";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSession } from "@/lib/auth-client";

export function PlayerInfoSection() {
  const { data: session } = useSession();
  const { profile } = useUserProfile();

  const playerName = profile?.name || session?.user?.name || "OPERATIVE";
  const playerEmail = profile?.email || session?.user?.email || "N/A";
  const playerPhone = profile?.phone || "N/A";
  const regNo = profile?.regNo || profile?.activeRegistration?.regNo || "N/A";

  return (
    <div className="flex flex-col h-full py-4 px-3 sm:px-5 select-none">
      {/* Header wordmark: PLAYER INFO */}
      <div className="mb-3 sm:mb-4">
        <div className="relative w-40 sm:w-48 aspect-[302/25]">
          <Image
            src="/profile/profile-team1/PLAYER INFO.svg"
            alt="PLAYER INFO"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
      </div>

      {/* Single column stacked list */}
      <div className="flex flex-col justify-between flex-1 gap-2">
        {/* Row 1: PLAYER */}
        <PassDetailItem
          icon="/profile/profile-solo/playericon.svg"
          label="PLAYER"
          value={playerName}
        />

        {/* Divider */}
        <div className="relative h-0.5 w-full opacity-70">
          <Image
            src="/profile/profile-solo/Group 698.svg"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        {/* Row 2: EMAIL ID */}
        <PassDetailItem
          icon="/profile/profile-solo/email.svg"
          label="EMAIL ID"
          value={playerEmail}
        />

        {/* Divider */}
        <div className="relative h-0.5 w-full opacity-70">
          <Image
            src="/profile/profile-solo/Group 698.svg"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        {/* Row 3: REG NO */}
        <PassDetailItem
          icon="/profile/profile-solo/regno.svg"
          label="REG. NO."
          value={regNo}
        />

        {/* Divider */}
        <div className="relative h-0.5 w-full opacity-70">
          <Image
            src="/profile/profile-solo/Group 698.svg"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        {/* Row 4: PHONE NO */}
        <PassDetailItem
          icon="/profile/profile-solo/Group 741.svg"
          label="PHONE NO."
          value={playerPhone}
        />
      </div>
    </div>
  );
}
