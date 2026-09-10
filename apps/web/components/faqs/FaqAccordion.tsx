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

export function FaqAccordion() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <div className="relative w-full py-2 sm:py-0">
            <div
                className="absolute left-[10px] top-3 bottom-3 w-px bg-white/15 sm:left-3 sm:top-0 sm:bottom-0"
                aria-hidden
            />

            <ol className="flex flex-col gap-3.5 sm:gap-3">
                {faqItems.map((entry, index) => (
                    <li key={entry.question} className="relative flex items-center gap-4 sm:gap-5">
                        <div className="flex w-5 shrink-0 items-center justify-center sm:w-6">
                            <span
                                className={`relative z-10 flex size-5 items-center justify-center rounded-full border-2 bg-ink sm:size-6 ${DOT_RING[entry.color]}`}
                            >
                                <span className={`size-2 rounded-full sm:size-2.5 ${DOT_FILL[entry.color]}`} />
                            </span>
                        </div>
                        <div className="flex-1">
                            <FaqItem
                                entry={entry}
                                isOpen={openIndex === index}
                                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                            />
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}