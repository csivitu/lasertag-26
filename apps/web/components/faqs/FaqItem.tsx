import type { FaqEntry } from "./faqItems.data";
import { FaqPixelFrame } from "./FaqPixelFrame";

const COLOR_CLASSES: Record<FaqEntry["color"], { text: string; bg: string }> = {
    pink: { text: "text-brand-pink", bg: "bg-brand-pink" },
    yellow: { text: "text-brand-yellow", bg: "bg-brand-yellow" },
    cyan: { text: "text-brand-cyan", bg: "bg-brand-cyan" },
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
            onClick={onToggle}
            className={`faq-pixel-corners relative bg-ink/60 px-4 py-2.5 transition-colors cursor-pointer sm:px-5 sm:py-2.5 lg:py-3 ${colors.text}${isOpen ? " faq-item--open" : ""}`}
        >
            <FaqPixelFrame />
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                aria-expanded={isOpen}
                className="relative z-[2] flex w-full items-center justify-between gap-4 text-left"
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

            <div className="faq-item__panel relative z-[2]" data-open={isOpen}>
                <div className="overflow-hidden">
                    <div className="-mx-4 mt-2 h-[3px] w-auto bg-current sm:-mx-5 sm:mt-3" aria-hidden />
                    <p className="pt-2 font-body text-sm leading-relaxed text-white/70 sm:pt-3 sm:text-base">
                        {entry.answer}
                    </p>
                </div>
            </div>
        </div>
    );
}