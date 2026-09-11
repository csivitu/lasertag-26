import { CARD_FRAME_PATH, CARD_FRAME_VIEWBOX, type RuleCardData } from "./guidelines.data";

const ACCENT_TEXT: Record<RuleCardData["accent"], string> = {
  pink: "text-brand-pink",
  cyan: "text-brand-cyan",
  yellow: "text-guideline-yellow",
};

const ACCENT_BG: Record<RuleCardData["accent"], string> = {
  pink: "bg-brand-pink",
  cyan: "bg-brand-cyan",
  yellow: "bg-guideline-yellow",
};

export function RuleCard({ id, accent, items }: RuleCardData) {
  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3.5 sm:gap-5 sm:px-6 sm:py-5 lg:flex-1 lg:gap-5 xl:gap-7 lg:px-[2.2vw] lg:py-[1.2svh] xl:py-[1.6svh] ${ACCENT_TEXT[accent]}`}
    >
      <svg
        aria-hidden
        viewBox={CARD_FRAME_VIEWBOX}
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 size-full"
      >
        <path d={CARD_FRAME_PATH} fill="none" stroke="currentColor" strokeWidth={5} />
      </svg>

      <span
        className={`relative grid aspect-[91/85] w-14 shrink-0 place-items-center rounded-full font-digit font-bold text-2xl text-ink self-start sm:w-18 sm:text-3xl lg:w-[clamp(3.5rem,8.5svh,5.5rem)] xl:w-[clamp(4.25rem,10.5svh,6.75rem)] lg:text-[clamp(1.75rem,4.2svh,3.2rem)] xl:text-[clamp(2.1rem,5.5svh,3.8rem)] ${ACCENT_BG[accent]}`}
      >
        {String(id).padStart(2, "0")}
      </span>

      <ul className="relative min-w-0 flex-1 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-white marker:text-white/70 sm:space-y-2 sm:text-sm lg:space-y-[0.4svh] xl:space-y-[0.8svh] lg:text-[clamp(0.82rem,1.75svh,1.15rem)] xl:text-[clamp(1.05rem,2.1svh,1.35rem)] lg:leading-snug xl:leading-normal">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
