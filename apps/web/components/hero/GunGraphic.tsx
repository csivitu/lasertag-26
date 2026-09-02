import Image from "next/image";

export function GunGraphic({ variant }: { variant: "desktop" | "mobile" }) {
  if (variant === "mobile") {
    return (
      <div className="relative -mt-6 h-[70vw] w-[92%]" aria-hidden>
        <Image
          src="/hero/gun.png"
          alt=""
          fill
          className="object-contain object-left-top"
          sizes="92vw"
          priority
        />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <Image
        src="/hero/gun.png"
        alt=""
        fill
        className="object-contain object-left"
        sizes="34vw"
        priority
      />
    </div>
  );
}
