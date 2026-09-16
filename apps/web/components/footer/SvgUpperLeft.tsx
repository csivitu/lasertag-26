/* eslint-disable @next/next/no-img-element */
export default function SvgUpperLeft() {
  return (
    <div className="flex w-full select-none items-center justify-center mt-3 sm:mt-4">
      <div className="relative w-full translate-x-[2%] max-w-[400px] [container-type:inline-size] sm:max-w-[480px] md:max-w-[480px] lg:max-w-[750px] xl:max-w-[820px]">
        <img
          src="/footer/upper-left-group.svg"
          alt="Laser tag arcade cabinet"
          draggable={false}
          className="h-auto w-full select-none object-contain drop-shadow-[0_0_35px_rgba(237,43,132,0.2)]"
          fetchPriority="high"
        />

          <div
          className="absolute flex flex-col items-center justify-center text-center"
          style={{
            left: "32.8%",
            top: "31.5%",
            width: "35.28%",
            height: "13.02%",
          }}
        >
          {/* Real pixel-font text instead of the baked SVG: scales with the
              cabinet via cqw, pink offset matches the original art. */}
          {/* perspective() + rotateY: left edge closer/bigger, shrinking
              smoothly toward the right like text receding on the glass. */}
          <p className="ready-crt font-pixel text-[5.3cqw] leading-[1.25] whitespace-nowrap text-brand-yellow [text-shadow:0.35cqw_0.35cqw_0_var(--color-brand-pink)] [transform:perspective(350px)_rotateY(10deg)_skewX(7deg)]">
            ARE YOU
            <br />
            READY?
          </p>
        </div>
      </div>
    </div>
  );
}