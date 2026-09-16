"use client";

import { playSound } from "@/lib/sound";
import Link from "next/link";
import {
  BUTTON_H,
  BUTTON_W,
  PALETTE,
  PRESSED_BANDS,
  RESTING_BANDS,
} from "./registerButton.data";

function Face({ bands, className }: { bands: typeof RESTING_BANDS; className: string }) {
  return (
    <g className={className}>
      {bands.map(([y0, y1, runs]) =>
        runs.map(([x0, x1, color]) => (
          <rect
            key={`${y0}-${x0}`}
            x={x0}
            y={y0}
            width={x1 - x0}
            height={y1 - y0}
            fill={PALETTE[color]}
          />
        )),
      )}
    </g>
  );
}

export function RegisterButton() {
  return (
    <Link
      href="/select-mode"
      onClick={() => playSound("buttonClick", 0.7)}
      className="@container hero-btn group relative block w-full outline-offset-4 transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <svg
        viewBox={`0 0 ${BUTTON_W} ${BUTTON_H}`}
        aria-hidden
        shapeRendering="crispEdges"
        className="block h-auto w-full"
      >
        <Face bands={RESTING_BANDS} className="hero-btn__resting" />
        <Face bands={PRESSED_BANDS} className="hero-btn__pressed" />
      </svg>
      <span className="hero-btn__label pointer-events-none absolute inset-0 grid place-items-center font-pixel text-[clamp(11px,5.2cqw,17px)] uppercase tracking-wide text-white lg:text-[clamp(18px,5.5cqw,22px)]">
        Register Now
      </span>
      <span
        aria-hidden
        className="hero-btn__shine hero-btn__shine--rest pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span className="button-shine block h-full w-1/3" />
      </span>
      <span
        aria-hidden
        className="hero-btn__shine hero-btn__shine--press pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span className="button-shine block h-full w-1/3" />
      </span>
    </Link>
  );
}
