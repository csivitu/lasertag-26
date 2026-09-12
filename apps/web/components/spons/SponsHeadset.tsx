import Image from "next/image";

export function SponsHeadset() {
  return (
    <div className="relative w-[min(80vw,1163px)]">

      {/* BOTTOM — middle section */}
      <Image
        src="/spons/headset-middle.svg"
        alt=""
        width={777}
        height={320}
        className="absolute left-[16.6%] top-[32.9%] z-0 h-auto w-[66.8%]"
      />

      {/* MIDDLE — main headset */}
      <Image
        src="/spons/headset.svg"
        alt=""
        width={1163}
        height={691}
        className="relative z-10 h-auto w-full"
        priority
      />

      {/* TOP — hover only over middle section */}
      <div className="group absolute left-[16.6%] top-[32.9%] z-20 h-[46.3%] w-[66.8%] overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[20%] -translate-x-[200%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[700%]" />
      </div>

      {/* XGT logo */}
      <div className="absolute left-1/2 top-[36%] z-30 w-[30%] -translate-x-1/2">
        <Image
          src="/spons/xgt-logo.svg"
          alt="XGT"
          width={400}
          height={120}
          className="h-auto w-full"
        />
      </div>

    </div>
  );
}