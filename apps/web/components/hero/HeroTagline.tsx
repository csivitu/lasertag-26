export function HeroTagline() {
  return (
    <p
      className="tagline-crt-glitch relative mt-3 inline-flex items-center justify-center whitespace-nowrap text-center font-pixel text-[clamp(10px,2vw,15px)] text-brand-cyan sm:mt-4 lg:mt-[1.4vh] lg:text-[clamp(12px,1.6vw,22px)]"
      style={{ lineHeight: "1.6em" }}
    >
      <span>From Pixels to&nbsp;</span>
      <span className="pew-pew-typewriter inline-block overflow-hidden whitespace-nowrap">
        Pew Pew
      </span>
      <span
        aria-hidden
        className="cursor-blink ml-[0.25em] inline-block h-[0.85em] w-[0.55em] bg-brand-cyan"
      />
    </p>
  );
}
