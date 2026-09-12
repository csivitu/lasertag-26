"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { FaqAccordion } from "./FaqAccordion";
import { FaqFooterBar } from "./FaqFooterBar";
import { FaqHeader } from "./FaqHeader";
import { FaqSideArt } from "./FaqSideArt";

export function Faq() {
    const [isJumping, setIsJumping] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleToggle = useCallback(() => {
        setIsJumping(true);
        if (jumpTimer.current) clearTimeout(jumpTimer.current);
        jumpTimer.current = setTimeout(() => setIsJumping(false), 700);
    }, []);

    useEffect(() => {
        return () => { if (jumpTimer.current) clearTimeout(jumpTimer.current); };
    }, []);

    return (
        <section className="relative isolate flex min-h-[100svh] flex-col justify-between overflow-hidden bg-transparent">

            {/* Side art — absolutely positioned, tablet+ */}
            <div className="pointer-events-none absolute inset-0 bottom-5 z-[5] hidden md:block sm:bottom-6">
                <FaqSideArt isJumping={isJumping} isActive={isActive} />
            </div>

            <div className="relative z-10 flex flex-1 flex-col justify-center py-4 sm:py-6 lg:py-8">
                <FaqHeader />

                <div className="mx-auto flex w-full max-w-6xl flex-1 items-center px-5 pt-2 pb-4 sm:px-8 md:px-10 lg:px-12">
                    <div className="w-full md:w-[68%] lg:w-[62%] xl:w-[58%]">
                        {/* Mobile ralph image — directly above the items */}
                        <div className="flex justify-center pb-3.5 md:hidden">
                            <Image
                                src={isActive ? "/faq/ralph.png" : "/faq/ralph-calm.png"}
                                alt="Wreck-It Ralph pixel art"
                                width={129}
                                height={143}
                                unoptimized
                                className={`h-auto w-24 sm:w-28${isJumping ? " ralph-jump" : ""}`}
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