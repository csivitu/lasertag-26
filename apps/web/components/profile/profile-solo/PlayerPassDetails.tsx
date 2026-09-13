"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface DetailTileProps {
  icon: string;
  label: string;
  value?: string; 
  valueText?: string;
  labelW: string;
  labelAspect: string;
  valueW: string;
  valueAspect: string;
  alt?: string;
}

function DetailTile({
  icon,
  label,
  value,
  valueText,
  labelW,
  labelAspect,
  valueW,
  valueAspect,
  alt,
}: DetailTileProps) {
  return (
    <div className="flex items-center gap-3 sm:gap-4 pl-2">
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0">
        <Image src={icon} alt="" fill className="object-contain" />
      </div>
      <div className="flex flex-col justify-center gap-1">
        <div className={`relative h-4 sm:h-4.5 ${labelW} ${labelAspect}`}>
          <Image src={label} alt="" fill className="object-contain object-left" />
        </div>
        {valueText ? (
          <div className={`h-3.5 sm:h-4 flex items-center ${valueW} ${valueAspect}`}>
            <span className="text-white text-xs sm:text-sm leading-tight truncate">
              {valueText}
            </span>
          </div>
        ) : (
          <div className={`relative h-3.5 sm:h-4 ${valueW} ${valueAspect}`}>
            {value && <Image src={value} alt={alt || ""} fill className="object-contain object-left" />}
          </div>
        )}
      </div>
    </div>
  );
}

type Profile = {
  player: string;
  date: string;
  email: string;
  timeslot: string;
  regNo: string;
  phone?: string;
};

export function PlayerPassDetails() {
  const [profile, setProfile] = useState<Profile>({
    player: "Ananya Chaudhary",
    date: "19 SEPTEMBER 2026",
    email: "abc@gmail.com",
    timeslot: "10:00 - 10:15 AM",
    regNo: "25BCE0111",
    phone: "9863547243",
  });

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile/solo");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) {
          setProfile((p) => ({ ...p, ...data }));
        }
      } catch (e) {
        // silent fallback to defaults
      }
    }

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col justify-between h-full py-4 px-2 sm:px-6">
      {/* Header wordmark: PLAYER PASS */}
      <div className="flex justify-center mb-3 sm:mb-5">
        <div className="relative w-[min(70%,260px)] aspect-[412/25]">
          <Image
            src="/profile/profile-solo/PLAYER PASS.svg"
            alt="PLAYER PASS"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* 3x2 Grid layout */}
      <div className="relative flex-1 grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-y-5 gap-x-6 items-center">
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
        <DetailTile
          icon="/profile/profile-solo/playericon.svg"
          label="/profile/profile-solo/PLAYER.svg"
          valueText={profile.player}
          labelW="w-20 sm:w-24"
          labelAspect="aspect-[141/21]"
          valueW="w-32 sm:w-40"
          valueAspect="aspect-[176/19]"
          alt={profile.player}
        />

        {/* Row 1 Col 2: DATE */}
        <div className="md:pl-4">
          <DetailTile
            icon="/profile/profile-solo/Group 742.svg"
            label="/profile/profile-solo/DATE.svg"
            valueText={profile.date}
            labelW="w-14 sm:w-16"
            labelAspect="aspect-[93/21]"
            valueW="w-36 sm:w-40"
            valueAspect="aspect-[194/14]"
            alt={profile.date}
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
        <DetailTile
          icon="/profile/profile-solo/email.svg"
          label="/profile/profile-solo/EMAIL ID.svg"
          valueText={profile.email}
          labelW="w-24 sm:w-28"
          labelAspect="aspect-[189/21]"
          valueW="w-28 sm:w-32"
          valueAspect="aspect-[146/19]"
          alt={profile.email}
        />

        {/* Row 2 Col 2: TIME SLOT */}
        <div className="md:pl-4">
          <DetailTile
            icon="/profile/profile-solo/timeslot.svg"
            label="/profile/profile-solo/TIME SLOT.svg"
            valueText={profile.timeslot}
            labelW="w-26 sm:w-30"
            labelAspect="aspect-[210/21]"
            valueW="w-28 sm:w-32"
            valueAspect="aspect-[154/14]"
            alt={profile.timeslot}
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
        <DetailTile
          icon="/profile/profile-solo/regno.svg"
          label="/profile/profile-solo/REG. No..svg"
          valueText={profile.regNo}
          labelW="w-24 sm:w-28"
          labelAspect="aspect-[180/21]"
          valueW="w-20 sm:w-24"
          valueAspect="aspect-[105/14]"
          alt={profile.regNo}
        />

        {/* Row 3 Col 2: PHONE NO */}
        <div className="md:pl-4">
          <DetailTile
            icon="/profile/profile-solo/Group 741.svg"
            label="/profile/profile-solo/PHONE NO..svg"
            valueText={profile.phone}
            labelW="w-26 sm:w-30"
            labelAspect="aspect-[204/21]"
            valueW="w-20 sm:w-24"
            valueAspect="aspect-[114/14]"
            alt={profile.phone}
          />
        </div>
      </div>
    </div>
  );
}
