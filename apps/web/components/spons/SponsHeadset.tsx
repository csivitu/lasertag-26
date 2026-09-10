import Image from "next/image";

export function SponsHeadset() {
  return (
    <div className="relative w-[clamp(280px,80vw,1160px)]">
      {/* BOTTOM — middle section */}
      <div
        className="absolute z-0"
        style={{
          left: "16.6%",
          top: "32.9%",
          width: "66.8%",
        }}
      >
        <Image
          src="/spons/headset-middle.svg"
          alt=""
          width={777}
          height={320}
          className="h-auto w-full"
        />
      </div>

      {/* MIDDLE — main headset */}
      <Image
        src="/spons/headset.svg"
        alt=""
        width={1163}
        height={691}
        className="relative z-10 h-auto w-full"
        priority
      />

      {/* TOP — hover shine */}
      <div
        className="group absolute z-20 overflow-hidden"
        style={{
          left: "16.6%",
          top: "32.9%",
          width: "66.8%",
          height: "46.3%",
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[30%] -translate-x-[200%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[450%]" />
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