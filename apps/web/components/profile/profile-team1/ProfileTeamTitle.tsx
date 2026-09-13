import Image from "next/image";

export function ProfileTeamTitle() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 text-center mb-3 lg:mb-0 select-none">
      {/* PLAYER PROFILE */}
      <div className="relative w-[min(92vw,650px)] aspect-[707/88]">
        <Image
          src="/profile/profile-solo/PLAYER PROFILE.svg"
          alt="PLAYER PROFILE"
          fill
          priority
          className="object-contain"
        />
      </div>

      {/* CHECK YOUR PLAYER STATUS */}
      <div className="relative w-[min(80vw,450px)] aspect-[496/20]">
        <Image
          src="/profile/profile-solo/CHECK YOUR PLAYER STATUS.svg"
          alt="CHECK YOUR PLAYER STATUS"
          fill
          priority
          className="object-contain"
        />
      </div>
    </div>
  );
}
