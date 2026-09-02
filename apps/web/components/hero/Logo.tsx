import Image from "next/image";

export function Logo() {
  return (
    <Image
      src="/hero/logo-badge.png"
      alt="LaserTag"
      width={80}
      height={80}
      className="h-14 w-14 md:h-20 md:w-20"
      priority
    />
  );
}
