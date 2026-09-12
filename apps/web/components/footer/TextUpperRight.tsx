/* eslint-disable @next/next/no-img-element */
export default function TextUpperRight() {
  return (
    <div className="flex w-full max-w-[649px] flex-col items-center justify-center gap-6 text-center">
      <div className="hero-grid-title text-[18px] leading-[30px] tracking-[0.1em] sm:text-[24px] sm:leading-[38px] md:text-[30px] md:leading-[46px] lg:text-[36px] lg:leading-[52px]">
        ENTER THE GRID
        <br />
        SECURE YOUR SLOT
        <br />
        FOR THE ULTIMATE
        <br />
        LASERTAG
        <br />
        SHOWDOWN!
      </div>

      <button
        type="button"
        data-testid="cta-placeholder-box"
        className="btn-book-now group relative block aspect-[305/87] h-auto w-[220px] max-w-full cursor-pointer"
        aria-label="Book Now"
      >
        <img
          src="/footer/group-598.png"
          alt=""
          className="btn-book-now-normal absolute inset-0 h-full w-full"
        />
        <img
          src="/footer/group-597.svg"
          alt=""
          className="btn-book-now-pressed absolute inset-0 h-full w-full"
        />
        <span
          aria-hidden
          className="btn-book-now-shine--rest pointer-events-none absolute inset-0 overflow-hidden"
        >
          <span className="button-shine block h-full w-1/3" />
        </span>
        <span
          aria-hidden
          className="btn-book-now-shine--press pointer-events-none absolute inset-0 overflow-hidden"
        >
          <span className="button-shine block h-full w-1/3" />
        </span>
      </button>
    </div>
  );
}
