const BTN_PATH =
  "M33,0 L366,0 L366,2 L370,2 L370,6 L379,6 L379,14 L389,14 L389,31 L399,31 L399,63 L394,63 L394,72 L382,72 L382,81 L375,81 L375,90 L360,90 L360,95 L39,95 L39,90 L24,90 L24,81 L17,81 L17,72 L5,72 L5,63 L0,63 L0,31 L10,31 L10,14 L20,14 L20,6 L29,6 L29,2 L33,2 Z";

const CENTER = { transformOrigin: "199.5px 47.5px", transformBox: "view-box" as const };

export function RegisterButton() {
  return (
    <a
      href="#register"
      className="hero-btn group relative block w-full outline-offset-4 transition-[transform,filter] duration-150 ease-out hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <svg
        viewBox="0 0 399 95"
        aria-hidden
        shapeRendering="crispEdges"
        className="hero-btn__frame block h-auto w-full"
      >
        <path className="hero-btn__base" d={BTN_PATH} fill="var(--color-btn-shadow)" />
        <path
          className="hero-btn__bevel"
          d={BTN_PATH}
          style={{ ...CENTER, transform: "scale(0.94)" }}
          fill="var(--color-btn-bevel)"
        />
        <path
          className="hero-btn__lip"
          d={BTN_PATH}
          style={{ ...CENTER, transform: "scale(0.89)" }}
          fill="var(--color-btn-lip)"
        />
        <path
          className="hero-btn__face"
          d={BTN_PATH}
          style={{ ...CENTER, transform: "scale(0.86)" }}
          fill="var(--color-brand-pink)"
        />
      </svg>
      <span className="hero-btn__label pointer-events-none absolute inset-0 grid place-items-center font-pixel text-[3.4vw] uppercase tracking-wide text-white sm:text-[2vw] lg:text-[1.15vw]">
        Register Now
      </span>
      <span aria-hidden className="button-shine hero-btn__shine pointer-events-none absolute inset-0" />
    </a>
  );
}
