"use client";

import { useState } from "react";

import { faqItems } from "./faqItems.data";
import { FaqItem } from "./FaqItem";

const DOT_RING: Record<string, string> = {
    pink: "border-brand-pink",
    yellow: "border-brand-yellow",
    cyan: "border-brand-cyan",
};

const DOT_FILL: Record<string, string> = {
    pink: "bg-brand-pink",
    yellow: "bg-brand-yellow",
    cyan: "bg-brand-cyan",
};

export function FaqAccordion({ onToggle: onToggleCallback, onActiveChange }: { onToggle?: () => void; onActiveChange?: (isActive: boolean) => void } = {}) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="relative w-full py-0">
            <ol className="flex flex-col gap-5 sm:gap-5 lg:gap-6">
                {faqItems.map((entry, index) => (
                    <li key={entry.question} className="relative flex items-start gap-4 sm:gap-5">
                        {/* Upper half-segment: from mid-gap above down to this dot's center (not on first item) */}
                        {index > 0 && (
                            <div
                                className="absolute left-[8px] -top-2.5 bottom-[calc(100%_-_18px)] w-1 bg-white/15 sm:left-[10px] sm:bottom-[calc(100%_-_20px)] lg:-top-3 lg:bottom-[calc(100%_-_20px)]"
                                aria-hidden
                            />
                        )}
                        {/* Lower half-segment: from this dot's center down to mid-gap below (not on last item) */}
                        {index < faqItems.length - 1 && (
                            <div
                                className="absolute left-[8px] top-[18px] -bottom-2.5 w-1 bg-white/15 sm:left-[10px] sm:top-5 lg:top-5 lg:-bottom-3"
                                aria-hidden
                            />
                        )}
                        <div className="flex w-5 shrink-0 justify-center pt-2 sm:w-6 sm:pt-2 lg:pt-2">
                            <span
                                data-color={entry.color}
                                className={`relative z-10 flex size-5 items-center justify-center rounded-full border-2 bg-ink sm:size-6 ${DOT_RING[entry.color]}${openIndex === index ? " faq-dot--open" : ""}`}
                            >
                                <span className={`size-2 rounded-full sm:size-2.5 ${DOT_FILL[entry.color]}`} />
                            </span>
                        </div>
                        <div className="flex-1">
                            <FaqItem
                                entry={entry}
                                isOpen={openIndex === index}
                                onToggle={() => {
                                    const nextIndex = openIndex === index ? null : index;
                                    setOpenIndex(nextIndex);
                                    onActiveChange?.(nextIndex !== null);
                                    onToggleCallback?.();
                                }}
                            />
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}