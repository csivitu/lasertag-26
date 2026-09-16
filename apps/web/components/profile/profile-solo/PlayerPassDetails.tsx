"use client";

import Image from "next/image";
import { PassDetailItem } from "../shared/PassDetailItem";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSession } from "@/lib/auth-client";
import { formatPassDate, formatPassTime } from "@/lib/formatPassDateTime";

export function PlayerPassDetails() {
  const { data: session } = useSession();
  const { profile } = useUserProfile();

  const playerName = profile?.name || session?.user?.name || "OPERATIVE";
  const playerEmail = profile?.email || session?.user?.email || "N/A";
  const playerPhone = profile?.phone || "N/A";
  const regNo = profile?.regNo || profile?.activeRegistration?.regNo || "N/A";
  const rawDate = profile?.activeRegistration?.slot?.slotDate;
  const rawTime = profile?.activeRegistration?.slot?.slotTime;

  const slotDate = formatPassDate(rawDate);
  const slotTime = formatPassTime(rawTime);

  return (
    <div className="flex flex-col justify-between h-full py-4 px-2 sm:px-6 select-none">
      {/* Header wordmark: PLAYER PASS */}
      <div className="flex justify-center mb-3 sm:mb-5">
        <div className="relative w-[min(70%,260px)] aspect-[412/25]">
          <Image
            src="/profile/profile-solo/PLAYER PASS.svg"
            alt="PLAYER PASS"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* 3x2 Grid layout */}
      <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-3.5 md:gap-y-4 gap-x-6 items-center">
        {/* Vertical Dashed Center Line (desktop) */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-1 pointer-events-none opacity-80">
          <Image
            src="/profile/profile-solo/Group 641.svg"
            alt=""
            fill
            className="object-contain"
          />
        </div>

        {/* Row 1 Col 1: PLAYER */}
        <PassDetailItem
          icon="/profile/profile-solo/playericon.svg"
          label="PLAYER"
          value={playerName}
        />

        {/* Row 1 Col 2: DATE */}
        <div className="md:pl-4">
          <PassDetailItem
            icon="/profile/profile-solo/Group 742.svg"
            label="DATE"
            value={slotDate}
            multiline
          />
        </div>

        {/* Horizontal Dashed Divider Line 1 */}
        <div className="col-span-1 md:col-span-2 relative h-0.5 w-full my-1 opacity-70">
          <Image
            src="/profile/profile-solo/Group 642.svg"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        {/* Row 2 Col 1: EMAIL ID */}
        <PassDetailItem
          icon="/profile/profile-solo/email.svg"
          label="EMAIL ID"
          value={playerEmail}
        />

        {/* Row 2 Col 2: TIME SLOT */}
        <div className="md:pl-4">
          <PassDetailItem
            icon="/profile/profile-solo/timeslot.svg"
            label="TIME SLOT"
            value={slotTime}
            multiline
          />
        </div>

        {/* Horizontal Dashed Divider Line 2 */}
        <div className="col-span-1 md:col-span-2 relative h-0.5 w-full my-1 opacity-70">
          <Image
            src="/profile/profile-solo/Group 643.svg"
            alt=""
            fill
            className="object-cover"
          />
        </div>

        {/* Row 3 Col 1: REG NO */}
        <PassDetailItem
          icon="/profile/profile-solo/regno.svg"
          label="REG. NO."
          value={regNo}
        />

        {/* Row 3 Col 2: PHONE NO */}
        <div className="md:pl-4">
          <PassDetailItem
            icon="/profile/profile-solo/Group 741.svg"
            label="PHONE NO."
            value={playerPhone}
          />
        </div>
      </div>
    </div>
  );
}
