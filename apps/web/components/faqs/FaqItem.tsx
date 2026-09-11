import type { FaqEntry } from "./faqItems.data";

const COLOR_CLASSES: Record<FaqEntry["color"], { border: string; text: string; bg: string }> = {
    pink: { border: "border-brand-pink", text: "text-brand-pink", bg: "bg-brand-pink" },
    yellow: { border: "border-brand-yellow", text: "text-brand-yellow", bg: "bg-brand-yellow" },
    cyan: { border: "border-brand-cyan", text: "text-brand-cyan", bg: "bg-brand-cyan" },
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
            data-color={entry.color}
            className={`faq-pixel-corners border-[3px] bg-ink/60 px-4 py-2.5 transition-colors sm:px-5 sm:py-2.5 lg:py-3 ${colors.border} ${colors.text}${isOpen ? " faq-item--open" : ""}`}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 text-left"
            >
                <span className="font-pixel text-[10px] leading-relaxed text-white sm:text-sm">
                    {entry.question}
                </span>
                <span
                    className="faq-item__icon relative shrink-0 size-5 sm:size-6"
                    data-open={isOpen}
                    aria-hidden
                >
                    <span className={`absolute inset-0 m-auto h-[68%] w-[2.5px] rounded-sm sm:w-[3px] bg-white`} />
                    <span className={`absolute inset-0 m-auto h-[2.5px] w-[68%] rounded-sm sm:h-[3px] bg-white`} />
                </span>
            </button>

            <div className="faq-item__panel" data-open={isOpen}>
                <div className="overflow-hidden">
                    <p className="pt-2 font-body text-xs leading-relaxed text-white/70 sm:pt-3 sm:text-sm">
                        {entry.answer}
                    </p>
                </div>
            </div>
        </div>
    );
}