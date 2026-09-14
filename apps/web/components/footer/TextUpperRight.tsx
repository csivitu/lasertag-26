/* eslint-disable @next/next/no-img-element */
"use client";

import { playSound } from "@/lib/sound";

export default function TextUpperRight() {
  return (
    <div className="flex w-full max-w-[649px] flex-col items-center justify-center gap-6 text-center sm:gap-8">
      <div className="hero-grid-title text-[13px] leading-[20px] tracking-[0.08em] sm:text-[18px] sm:leading-[28px] md:text-[24px] md:leading-[36px] lg:text-[32px] lg:leading-[44px]">
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
        onClick={() => playSound("buttonClick", 0.5)}
        className="btn-book-now group relative block aspect-[305/87] h-auto w-[185px] max-w-full cursor-pointer sm:w-[250px]"
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
