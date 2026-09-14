"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { FaqAccordion } from "./FaqAccordion";
import { FaqFooterBar } from "./FaqFooterBar";
import { FaqHeader } from "./FaqHeader";
import { FaqSideArt } from "./FaqSideArt";
import { playSound } from "@/lib/sound";

export function Faq() {
    const [isJumping, setIsJumping] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleToggle = useCallback(() => {
        playSound("ralphJump", 0.5);
        setIsJumping(true);
        if (jumpTimer.current) clearTimeout(jumpTimer.current);
        jumpTimer.current = setTimeout(() => setIsJumping(false), 700);
    }, []);

    useEffect(() => {
        return () => { if (jumpTimer.current) clearTimeout(jumpTimer.current); };
    }, []);

    // Preload both Ralph sprites so the src swap never decodes mid-animation
    useEffect(() => {
        for (const src of ["/faq/ralph.png", "/faq/ralph-calm.png"]) {
            const img = new window.Image();
            img.src = src;
        }
    }, []);

    return (
        <section id="faqs" className="relative isolate flex min-h-0 flex-col justify-between overflow-hidden bg-transparent py-8 sm:py-12 lg:min-h-[100svh] lg:py-0">

            {/* Side art — absolutely positioned, desktop only (like hero art) */}
            <div className="pointer-events-none absolute inset-0 bottom-5 z-[5] hidden sm:bottom-6 lg:block">
                <FaqSideArt isJumping={isJumping} isActive={isActive} />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-3 lg:gap-0 lg:flex-1 lg:justify-start lg:py-8 lg:pt-12">
                <FaqHeader />

                <div className="mx-auto flex w-full max-w-6xl items-center px-4 sm:px-8 md:px-10 lg:flex-1 lg:px-12">
                    <div className="w-full lg:w-[62%] xl:w-[58%]">
                        {/* Mobile + tablet ralph image — directly above the items (fixed height so the sprite swap never shifts the list) */}
                        <div className="flex h-[89px] items-end justify-center pb-0 sm:h-[106px] lg:hidden">
                            <Image
                                src={isActive ? "/faq/ralph.png" : "/faq/ralph-calm.png"}
                                alt="Wreck-It Ralph pixel art"
                                width={129}
                                height={143}
                                unoptimized
                                className={`h-full w-auto object-contain${isJumping ? " ralph-jump" : ""}`}
                                style={{ imageRendering: "pixelated" }}
                            />
                        </div>

                        <FaqAccordion onToggle={handleToggle} onActiveChange={setIsActive} />
                    </div>
                </div>
            </div>

            <FaqFooterBar />
        </section>
    );
}