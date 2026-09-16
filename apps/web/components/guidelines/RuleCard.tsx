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
      className={`relative flex items-center gap-1 px-4 py-3.5 sm:gap-5 sm:px-6 sm:py-5 ${id === 1 ? "lg:flex-none" : "lg:flex-1"} lg:gap-3 xl:gap-4 lg:px-[1.6vw] ${id === 1 ? "lg:pb-[2svh] lg:pt-[2svh] xl:pb-[2.4svh] xl:pt-[2.4svh]" : "lg:pb-[1.4svh] lg:pt-[1.4svh] xl:pb-[1.8svh] xl:pt-[1.8svh]"} ${ACCENT_TEXT[accent]}`}
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
        className={`relative grid aspect-[91/85] w-8 shrink-0 place-items-center rounded-full font-digit font-black text-xl text-ink self-start sm:w-18 sm:text-[2rem] lg:mt-[0.8svh] lg:w-[clamp(2.5rem,6svh,3.75rem)] xl:w-[clamp(3rem,7.5svh,4.5rem)] lg:text-[clamp(1.5rem,3.5svh,2.5rem)] xl:text-[clamp(1.75rem,4.2svh,3rem)] ${ACCENT_BG[accent]}`}
      >
        {String(id).padStart(2, "0")}
      </span>

      <ul className="relative min-w-0 flex-1 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-white marker:text-white/70 sm:space-y-2 sm:text-sm lg:space-y-[0.5svh] xl:space-y-[0.8svh] lg:text-[clamp(1rem,2.3svh,1.4rem)] xl:text-[clamp(1.1rem,2.4svh,1.45rem)] lg:leading-snug xl:leading-snug">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
