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
      className={`relative flex items-start gap-3 px-4 py-3.5 sm:gap-6 sm:px-6 sm:py-5 lg:flex-1 lg:gap-6 lg:px-[2.2vw] lg:py-[1.8svh] ${ACCENT_TEXT[accent]}`}
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
        className={`relative grid aspect-[91/85] w-12 shrink-0 place-items-center rounded-full font-digit font-bold text-xl text-ink sm:w-16 sm:text-3xl lg:w-[clamp(3.25rem,8.5svh,5.75rem)] lg:text-[clamp(1.6rem,4.2svh,3.1rem)] ${ACCENT_BG[accent]}`}
      >
        {String(id).padStart(2, "0")}
      </span>

      <ul className="relative min-w-0 flex-1 list-disc space-y-1 pl-4 text-xs leading-relaxed text-white marker:text-white/70 sm:space-y-2 sm:text-sm lg:space-y-[0.5svh] lg:text-[clamp(0.9rem,1.9svh,1.25rem)] lg:leading-snug">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
