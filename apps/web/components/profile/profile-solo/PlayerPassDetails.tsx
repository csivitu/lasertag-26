import Image from "next/image";

interface DetailTileProps {
  icon: string;
  label: string;
  value: string;
  labelW: string;
  labelAspect: string;
  valueW: string;
  valueAspect: string;
  alt: string;
}

function DetailTile({
  icon,
  label,
  value,
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
        <div className={`relative h-3.5 sm:h-4 ${valueW} ${valueAspect}`}>
          <Image src={value} alt={alt} fill className="object-contain object-left" />
        </div>
      </div>
    </div>
  );
}

export function PlayerPassDetails() {
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
          value="/profile/profile-solo/Ananya Chaudhary.svg"
          labelW="w-20 sm:w-24"
          labelAspect="aspect-[141/21]"
          valueW="w-32 sm:w-40"
          valueAspect="aspect-[176/19]"
          alt="Ananya Chaudhary"
        />

        {/* Row 1 Col 2: DATE */}
        <div className="md:pl-4">
          <DetailTile
            icon="/profile/profile-solo/Group 742.svg"
            label="/profile/profile-solo/DATE.svg"
            value="/profile/profile-solo/19 SEPTEMBER 2026.svg"
            labelW="w-14 sm:w-16"
            labelAspect="aspect-[93/21]"
            valueW="w-36 sm:w-40"
            valueAspect="aspect-[194/14]"
            alt="19 SEPTEMBER 2026"
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
          value="/profile/profile-solo/abc@gmail.com.svg"
          labelW="w-24 sm:w-28"
          labelAspect="aspect-[189/21]"
          valueW="w-28 sm:w-32"
          valueAspect="aspect-[146/19]"
          alt="abc@gmail.com"
        />

        {/* Row 2 Col 2: TIME SLOT */}
        <div className="md:pl-4">
          <DetailTile
            icon="/profile/profile-solo/timeslot.svg"
            label="/profile/profile-solo/TIME SLOT.svg"
            value="/profile/profile-solo/10_00 - 10_15 AM.svg"
            labelW="w-26 sm:w-30"
            labelAspect="aspect-[210/21]"
            valueW="w-28 sm:w-32"
            valueAspect="aspect-[154/14]"
            alt="10:00 - 10:15 AM"
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
          value="/profile/profile-solo/25BCE0111.svg"
          labelW="w-24 sm:w-28"
          labelAspect="aspect-[180/21]"
          valueW="w-20 sm:w-24"
          valueAspect="aspect-[105/14]"
          alt="25BCE0111"
        />

        {/* Row 3 Col 2: PHONE NO */}
        <div className="md:pl-4">
          <DetailTile
            icon="/profile/profile-solo/Group 741.svg"
            label="/profile/profile-solo/PHONE NO..svg"
            value="/profile/profile-solo/9863547243.svg"
            labelW="w-26 sm:w-30"
            labelAspect="aspect-[204/21]"
            valueW="w-20 sm:w-24"
            valueAspect="aspect-[114/14]"
            alt="9863547243"
          />
        </div>
      </div>
    </div>
  );
}
