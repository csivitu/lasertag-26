import type { MouseEventHandler } from "react";

import {
  BUTTON_H,
  BUTTON_W,
  PALETTE,
  PRESSED_BANDS,
  RESTING_BANDS,
} from "./registerButton.data";

interface FaceProps {
  bands: typeof RESTING_BANDS;
  className: string;
}

interface PixelButtonProps {
  label: string;
  className?: string;
  labelClassName?: string;
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

function Face({ bands, className }: FaceProps) {
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

function ButtonFace({ label, labelClassName }: Pick<PixelButtonProps, "label" | "labelClassName">) {
  return (
    <>
      <svg
        viewBox={`0 0 ${BUTTON_W} ${BUTTON_H}`}
        aria-hidden="true"
        shapeRendering="crispEdges"
        className="block h-auto w-full"
      >
        <Face bands={RESTING_BANDS} className="hero-btn__resting" />
        <Face bands={PRESSED_BANDS} className="hero-btn__pressed" />
      </svg>
      <span
        className={`hero-btn__label pointer-events-none absolute inset-0 grid place-items-center font-pixel text-[11px] uppercase tracking-wide text-white ${labelClassName ?? ""}`}
      >
        {label}
      </span>
      <span
        aria-hidden="true"
        className="button-shine hero-btn__shine hero-btn__shine--rest pointer-events-none absolute inset-0"
      />
      <span
        aria-hidden="true"
        className="button-shine hero-btn__shine hero-btn__shine--press pointer-events-none absolute inset-0"
      />
    </>
  );
}

export function PixelButton({
  label,
  className = "",
  labelClassName,
  href,
  type = "button",
  onClick,
  disabled = false,
}: PixelButtonProps) {
  const rootClassName = `hero-btn group relative block outline-offset-4 transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`;
  const face = <ButtonFace label={label} labelClassName={labelClassName} />;

  if (href) {
    return (
      <a href={href} className={rootClassName}>
        {face}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${rootClassName} cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {face}
    </button>
  );
}
