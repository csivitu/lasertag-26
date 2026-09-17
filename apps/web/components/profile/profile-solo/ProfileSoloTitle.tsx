import Image from "next/image";

export function ProfileSoloTitle() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center pt-1 sm:pt-2 lg:pt-3 mb-2 lg:mb-0">
      <div className="relative w-[min(85vw,530px)] aspect-[707/88]">
        <Image
          src="/profile/profile-solo/PLAYER PROFILE.svg"
          alt="PLAYER PROFILE"
          fill
          priority
          className="object-contain"
        />
      </div>
      <div className="hidden md:block relative w-[min(70vw,370px)] aspect-[496/20]">
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
