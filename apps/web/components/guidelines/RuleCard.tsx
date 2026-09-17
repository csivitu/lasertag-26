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
  const flexClass =
    id === 1 ? "lg:flex-none" : id === 2 ? "lg:flex-[0.82]" : "lg:flex-[1.18]";

  return (
    <div
      className={`relative flex items-center gap-1 px-4 py-3 sm:gap-5 sm:px-6 sm:py-4.5 ${
        id === 1 ? "min-h-[82px] sm:min-h-[102px] lg:min-h-[15svh] xl:min-h-[16.5svh]" : ""
      } ${flexClass} lg:gap-3 xl:gap-4 lg:px-[1.6vw] lg:py-[1.2svh] xl:py-[1.5svh] ${ACCENT_TEXT[accent]}`}
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

      <ul className="relative min-w-0 flex-1 list-disc space-y-1 pl-4 text-xs leading-relaxed text-white marker:text-white/70 self-center sm:space-y-1.5 sm:text-sm lg:space-y-[0.45svh] xl:space-y-[0.7svh] lg:text-[clamp(0.95rem,2.15svh,1.35rem)] xl:text-[clamp(1.05rem,2.3svh,1.4rem)] lg:leading-snug xl:leading-snug">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
