export function HeroTagline() {
  return (
    <p
      className="tagline-crt-glitch relative mt-3 whitespace-nowrap text-center font-pixel text-[clamp(12px,1.6vw,22px)] text-brand-cyan sm:mt-4 lg:mt-[1.4vh]"
      style={{ lineHeight: "1.6em" }}
    >
      {"From Pixels to "}
      <span className="pew-pew-typewriter inline-block overflow-hidden whitespace-nowrap align-middle">
        Pew Pew
      </span>
      <span
        aria-hidden
        className="cursor-blink ml-[0.25em] inline-block h-[0.85em] w-[0.55em] align-middle bg-brand-cyan"
      />
    </p>
  );
}
