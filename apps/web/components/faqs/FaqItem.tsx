import type { FaqEntry } from "./faqItems.data";

const COLOR_CLASSES: Record<FaqEntry["color"], { border: string; text: string; ring: string }> = {
    pink: { border: "border-brand-pink", text: "text-brand-pink", ring: "ring-brand-pink" },
    yellow: { border: "border-brand-yellow", text: "text-brand-yellow", ring: "ring-brand-yellow" },
    cyan: { border: "border-brand-cyan", text: "text-brand-cyan", ring: "ring-brand-cyan" },
};

type FaqItemProps = {
    entry: FaqEntry;
    isOpen: boolean;
    onToggle: () => void;
};

export function FaqItem({ entry, isOpen, onToggle }: FaqItemProps) {
    const colors = COLOR_CLASSES[entry.color];

    return (
        <div
            className={`rounded-xl border-2 bg-ink/60 px-4 py-3 shadow-[0_0_14px_-4px_currentColor] transition-colors sm:px-6 sm:py-4 ${colors.border} ${colors.text}`}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 text-left"
            >
                <span className="font-pixel text-[11px] leading-relaxed text-white sm:text-sm">
                    {entry.question}
                </span>
                <span
                    className={`faq-item__icon shrink-0 text-xl font-pixel ${colors.text}`}
                    data-open={isOpen}
                    aria-hidden
                >
                    +
                </span>
            </button>

            <div className="faq-item__panel" data-open={isOpen}>
                <div className="overflow-hidden">
                    <p className="pt-3 font-body text-sm leading-relaxed text-white/70 sm:pt-4">
                        {entry.answer}
                    </p>
                </div>
            </div>
        </div>
    );
}