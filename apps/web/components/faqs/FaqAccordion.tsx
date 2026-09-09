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
        <div className="relative pl-9 sm:pl-11">
            <div className="absolute bottom-6 left-[14px] top-6 w-px bg-white/15 sm:left-[16px]" aria-hidden />

            <ol className="flex flex-col gap-4">
                {faqItems.map((entry, index) => (
                    <li key={entry.question} className="relative">
                        <span
                            className={`absolute left-[-30px] top-1/2 flex size-4 -translate-y-1/2 items-center justify-center rounded-full border-2 bg-ink sm:left-[-38px] sm:size-5 ${DOT_RING[entry.color]}`}
                            aria-hidden
                        >
                            <span className={`size-1.5 rounded-full sm:size-2 ${DOT_FILL[entry.color]}`} />
                        </span>
                        <FaqItem
                            entry={entry}
                            isOpen={openIndex === index}
                            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                        />
                    </li>
                ))}
            </ol>
        </div>
    );
}