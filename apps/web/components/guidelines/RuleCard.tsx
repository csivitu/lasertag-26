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
      className={`relative flex items-start gap-5 px-8 py-7 sm:gap-7 sm:px-10 sm:py-8 ${ACCENT_TEXT[accent]}`}
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
        className={`relative grid aspect-[91/85] w-[clamp(3.25rem,6vw,5.75rem)] shrink-0 place-items-center rounded-full font-digit text-[clamp(1.6rem,3vw,3.4rem)] text-ink ${ACCENT_BG[accent]}`}
      >
        {String(id).padStart(2, "0")}
      </span>

      <ul className="relative list-disc space-y-2 pl-5 text-[clamp(0.9rem,1.15vw,1.15rem)] leading-relaxed text-white marker:text-white/70">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
