const RESTING_OUTLINE =
  "M33,0 L366,0 L366,2 L370,2 L370,6 L379,6 L379,14 L389,14 L389,31 L399,31 L399,63 L394,63 L394,72 L382,72 L382,81 L375,81 L375,90 L360,90 L360,95 L39,95 L39,90 L24,90 L24,81 L17,81 L17,72 L5,72 L5,63 L0,63 L0,31 L10,31 L10,14 L20,14 L20,6 L29,6 L29,2 L33,2 Z";

const PRESSED_OUTLINE =
  "M33,8 L366,8 L366,10 L370,10 L370,14 L379,14 L379,22 L389,22 L389,37 L399,37 L399,66 L394,66 L394,74 L382,74 L382,82 L375,82 L375,90 L360,90 L360,95 L39,95 L39,90 L24,90 L24,82 L17,82 L17,74 L5,74 L5,66 L0,66 L0,37 L10,37 L10,22 L20,22 L20,14 L29,14 L29,10 L33,10 Z";

const RESTING_BANDS: [number, number, string][] = [
  [0, 4, "var(--color-brand-purple)"],
  [4, 9, "var(--color-btn-bevel)"],
  [9, 14, "var(--color-btn-lip)"],
  [14, 32, "var(--color-brand-pink)"],
  [32, 53, "#e94daa"],
  [53, 73, "var(--color-brand-pink)"],
  [73, 78, "var(--color-btn-bevel)"],
  [78, 82, "var(--color-brand-purple)"],
  [82, 95, "var(--color-btn-shadow)"],
];

const PRESSED_BANDS: [number, number, string][] = [
  [8, 12, "var(--color-btn-bevel)"],
  [12, 17, "var(--color-brand-purple)"],
  [17, 22, "var(--color-btn-shadow)"],
  [22, 40, "var(--color-brand-pink)"],
  [40, 61, "#e94daa"],
  [61, 81, "var(--color-brand-pink)"],
  [81, 86, "var(--color-btn-bevel)"],
  [86, 90, "var(--color-brand-purple)"],
  [90, 95, "var(--color-btn-shadow)"],
];

export function RegisterButton() {
  return (
    <a
      href="#register"
      className="hero-btn group relative block w-full outline-offset-4 transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <svg
        viewBox="0 0 399 95"
        aria-hidden
        shapeRendering="crispEdges"
        className="block h-auto w-full"
      >
        <clipPath id="hero-btn-rest-clip">
          <path d={RESTING_OUTLINE} />
        </clipPath>
        <clipPath id="hero-btn-press-clip">
          <path d={PRESSED_OUTLINE} />
        </clipPath>
        <g className="hero-btn__resting" clipPath="url(#hero-btn-rest-clip)">
          {RESTING_BANDS.map(([y0, y1, fill]) => (
            <rect key={y0} x={0} y={y0} width={399} height={y1 - y0} fill={fill} />
          ))}
        </g>
        <g className="hero-btn__pressed" clipPath="url(#hero-btn-press-clip)">
          {PRESSED_BANDS.map(([y0, y1, fill]) => (
            <rect key={y0} x={0} y={y0} width={399} height={y1 - y0} fill={fill} />
          ))}
        </g>
      </svg>
      <span className="hero-btn__label pointer-events-none absolute inset-0 grid place-items-center font-pixel text-[3.4vw] uppercase tracking-wide text-white sm:text-[2vw] lg:text-[1.15vw]">
        Register Now
      </span>
      <span
        aria-hidden
        className="button-shine hero-btn__shine hero-btn__shine--rest pointer-events-none absolute inset-0"
      />
      <span
        aria-hidden
        className="button-shine hero-btn__shine hero-btn__shine--press pointer-events-none absolute inset-0"
      />
    </a>
  );
}
