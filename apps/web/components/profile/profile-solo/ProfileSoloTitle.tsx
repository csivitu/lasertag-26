import Image from "next/image";

export function ProfileSoloTitle() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center pt-4 sm:pt-6 lg:pt-8 mb-4 lg:mb-0">
      <div className="relative w-[min(90vw,650px)] aspect-[707/88]">
        <Image
          src="/profile/profile-solo/PLAYER PROFILE.svg"
          alt="PLAYER PROFILE"
          fill
          priority
          className="object-contain"
        />
      </div>
      <div className="hidden md:block relative w-[min(75vw,450px)] aspect-[496/20]">
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
