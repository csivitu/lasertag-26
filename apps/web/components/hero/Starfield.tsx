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
          <path d="M34.5 0 44.16 17.28 69 24 44.16 30.72 34.5 48 24.84 30.72 0 24 24.84 17.28Z" />
        </symbol>
        <symbol id="hero-spark-b" viewBox="0 0 71 53">
          <path d="M35.5 0 45.44 18.58 71 26.5 45.44 34.42 35.5 53 25.56 34.42 0 26.5 25.56 18.58Z" />
        </symbol>
        <symbol id="hero-spark-c" viewBox="0 0 37 48">
          <path d="M18.5 0 23.68 17.28 37 24 23.68 30.72 18.5 48 13.32 30.72 0 24 13.32 17.28Z" />
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
