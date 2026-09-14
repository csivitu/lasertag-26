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
      className={`relative flex items-center gap-1 px-4 py-3.5 sm:gap-5 sm:px-6 sm:py-5 lg:flex-1 lg:gap-5 xl:gap-7 lg:px-[2.2vw] lg:pb-[1.4svh] lg:pt-[1.4svh] xl:pb-[1.8svh] xl:pt-[1.8svh] ${ACCENT_TEXT[accent]}`}
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
        className={`relative grid aspect-[91/85] w-8 shrink-0 place-items-center rounded-full font-digit font-black text-xl text-ink self-start sm:w-18 sm:text-[2rem] lg:mt-[0.8svh] lg:w-[clamp(3.5rem,8.5svh,5.5rem)] xl:w-[clamp(4.25rem,10.5svh,6.75rem)] lg:text-[clamp(2rem,4.8svh,3.6rem)] xl:text-[clamp(2.4rem,6svh,4.2rem)] ${ACCENT_BG[accent]}`}
      >
        {String(id).padStart(2, "0")}
      </span>

      <ul className="relative min-w-0 flex-1 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-white marker:text-white/70 sm:space-y-2 sm:text-sm lg:space-y-[0.5svh] xl:space-y-[0.9svh] lg:text-[clamp(1rem,2.2svh,1.45rem)] xl:text-[clamp(1.15rem,2.3svh,1.5rem)] lg:leading-snug xl:leading-normal">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
