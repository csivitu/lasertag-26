import Image from "next/image";

/**
 * Interim mobile hero. The Figma "Hero - Mobile" frame has not been traced yet —
 * this keeps the small-screen view presentable until we do that pass.
 */
export function HeroMobile() {
  return (
    <section className="relative overflow-hidden bg-[#08080d] px-6 pb-10 pt-14 lg:hidden">
      <div className="relative mx-auto w-[92%]">
        <Image
          src="/hero/title-wordmark.png"
          alt="LaserTag"
          width={2436}
          height={309}
          priority
          unoptimized
          className="h-auto w-full"
        />
      </div>
      <p className="mt-5 text-center font-pixel text-[3.2vw] text-[#23eff1]">
        From Pixels to Pew Pew
      </p>

      <div
        aria-hidden
        className="pointer-events-none relative mt-2 flex h-[95vw] items-center justify-center overflow-hidden"
      >
        <div
          className="relative flex-none overflow-hidden"
          style={{
            width: "175%",
            height: "175%",
            transform: "rotate(166.1deg) scaleY(-1)",
          }}
        >
          <div className="absolute left-0 top-0 h-[100.38%] w-[102.13%]">
            <Image
              src="/hero/gun.png"
              alt=""
              fill
              sizes="180vw"
              priority
              className="object-fill"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
