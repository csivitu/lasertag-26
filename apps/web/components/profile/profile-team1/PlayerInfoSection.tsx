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
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0">
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

export function PlayerInfoSection() {
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
          value="/profile/profile-solo/Ananya Chaudhary.svg"
          labelW="w-20 sm:w-30"
          labelAspect="aspect-[141/21]"
          valueW="w-40 sm:w-80"
          valueAspect="aspect-[176/19]"
          alt="Ananya Chaudhary"
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
          value="/profile/profile-solo/25BCE0111.svg"
          labelW="w-24 sm:w-50"
          labelAspect="aspect-[180/21]"
          valueW="w-20 sm:w-30"
          valueAspect="aspect-[105/14]"
          alt="25BCE0111"
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
          value="/profile/profile-solo/abc@gmail.com.svg"
          labelW="w-24 sm:w-50"
          labelAspect="aspect-[189/21]"
          valueW="w-28 sm:w-30"
          valueAspect="aspect-[146/19]"
          alt="abc@gmail.com"
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
          value="/profile/profile-solo/9863547243.svg"
          labelW="w-26 sm:w-50"
          labelAspect="aspect-[204/21]"
          valueW="w-20 sm:w-30"
          valueAspect="aspect-[114/14]"
          alt="9863547243"
        />
      </div>
    </div>
  );
}