import { dots, sparkles, VIEWBOX_H, VIEWBOX_W } from "./starfield.data";

export function Starfield() {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 z-0 size-full"
    >
      <defs>
        <symbol id="hero-spark-a" viewBox="0 0 69 48">
          <path d="M34.5 12 36 18 46 24.5 36 31 34.5 37 33 31 22 24.5 33 18Z" />
        </symbol>
        <symbol id="hero-spark-b" viewBox="0 0 71 53">
          <path d="M35.5 12.7 37.04 19.32 47.85 26.5 37.04 33.68 35.5 40.3 33.96 33.68 23.15 26.5 33.96 19.32Z" />
        </symbol>
        <symbol id="hero-spark-c" viewBox="0 0 37 48">
          <path d="M18.5 11.5 19.3 18 24.93 24 19.3 30 18.5 36.5 17.7 30 12.07 24 17.7 18Z" />
        </symbol>
      </defs>
      <g>
        {dots.map(([x, y, s, c, p], i) => (
          <rect
            key={`dot-${i}`}
            className={`hero-star hero-star-p${p}`}
            x={x}
            y={y}
            width={s}
            height={s}
            fill={c}
            transform={`rotate(45 ${x + s / 2} ${y + s / 2})`}
          />
        ))}
      </g>
      <g fill="var(--color-brand-pink)">
        {sparkles.map(([x, y, w, h, shape, p], i) => (
          <use
            key={`spark-${i}`}
            className={`hero-star hero-star-p${p}`}
            href={`#hero-spark-${shape}`}
            x={x}
            y={y}
            width={w}
            height={h}
          />
        ))}
      </g>
    </svg>
  );
}
