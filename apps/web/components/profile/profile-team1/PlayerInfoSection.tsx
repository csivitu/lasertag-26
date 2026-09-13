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
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
        <Image src={icon} alt="" fill className="object-contain" />
      </div>
      <div className="flex flex-col justify-center gap-1">
        <div className={`relative h-4 sm:h-4.5 ${labelW} ${labelAspect}`}>
          <Image src={label} alt="" fill className="object-contain object-left" />
        </div>
        {valueText ? (
          <div className={`h-3.5 sm:h-4 flex items-center ${valueW} ${valueAspect}`}>
            <span className="text-white text-xs sm:text-sm leading-tight truncate">{valueText}</span>
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
  regNo: string;
  email: string;
  phone?: string;
};

export function PlayerInfoSection() {
  const [profile, setProfile] = useState<Profile>({
    player: "Ananya Chaudhary",
    regNo: "25BCE0111",
    email: "abc@gmail.com",
    phone: "9863547243",
  });

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile/solo");
        if (!res.ok) return;
        const json = await res.json();
        if (mounted && json?.data) {
          const { player, regNo, email, phone } = json.data;
          setProfile((p) => ({ ...p, player, regNo, email, phone }));
        }
      } catch (e) {
        // ignore
      }
    }

    fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col h-full py-4 px-3 sm:px-5">
      {/* Header wordmark: PLAYER INFO */}
      <div className="mb-3 sm:mb-4">
        <div className="relative w-40 sm:w-48 aspect-[302/25]">
          <Image
            src="/profile/profile-team1/PLAYER INFO.svg"
            alt="PLAYER INFO"
            fill
            className="object-contain object-left"
          />
        </div>
      </div>

      {/* Single column stacked list */}
      <div className="flex flex-col justify-between flex-1 gap-2">
        {/* Row 1: PLAYER */}
        <DetailTile
          icon="/profile/profile-solo/playericon.svg"
          label="/profile/profile-solo/PLAYER.svg"
          valueText={profile.player}
          labelW="w-20 sm:w-30"
          labelAspect="aspect-[141/21]"
          valueW="w-40 sm:w-80"
          valueAspect="aspect-[176/19]"
          alt={profile.player}
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

        {/* Row 2: REG. No. */}
        <DetailTile
          icon="/profile/profile-solo/Group 750.svg"
          label="/profile/profile-solo/REG. No..svg"
          valueText={profile.regNo}
          labelW="w-24 sm:w-50"
          labelAspect="aspect-[180/21]"
          valueW="w-20 sm:w-30"
          valueAspect="aspect-[105/14]"
          alt={profile.regNo}
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

        {/* Row 3: EMAIL ID */}
        <DetailTile
          icon="/profile/profile-solo/Vector (3).svg"
          label="/profile/profile-solo/EMAIL ID.svg"
          valueText={profile.email}
          labelW="w-24 sm:w-50"
          labelAspect="aspect-[189/21]"
          valueW="w-28 sm:w-30"
          valueAspect="aspect-[146/19]"
          alt={profile.email}
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

        {/* Row 4: PHONE NO. */}
        <DetailTile
          icon="/profile/profile-solo/Group 752.svg"
          label="/profile/profile-solo/PHONE NO. (1).svg"
          valueText={profile.phone}
          labelW="w-26 sm:w-50"
          labelAspect="aspect-[204/21]"
          valueW="w-20 sm:w-30"
          valueAspect="aspect-[114/14]"
          alt={profile.phone}
        />
      </div>
    </div>
  );
}