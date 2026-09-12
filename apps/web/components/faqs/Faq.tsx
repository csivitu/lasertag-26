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
        <section className="relative isolate flex h-[100svh] flex-col overflow-hidden bg-transparent">

            {/* Side art — absolutely positioned, tablet+ */}
            <div className="pointer-events-none absolute inset-0 bottom-5 z-[5] hidden md:block sm:bottom-6">
                <FaqSideArt isJumping={isJumping} isActive={isActive} />
            </div>

            <div className="relative z-10 flex flex-1 min-h-0 flex-col">
                <FaqHeader />

                {/* Mobile ralph image */}
                <div className="flex justify-center pt-6 md:hidden">
                    <Image
                        src={isActive ? "/faq/ralph.png" : "/faq/ralph-calm.png"}
                        alt="Wreck-It Ralph pixel art"
                        width={129}
                        height={143}
                        unoptimized
                        className={`h-auto w-32 sm:w-40${isJumping ? " ralph-jump" : ""}`}
                        style={{ imageRendering: "pixelated" }}
                    />
                </div>

                <div className="mx-auto flex w-full max-w-6xl flex-1 items-start px-5 pt-2 pb-4 sm:px-8 md:items-center md:pt-0 md:px-10 lg:px-12">
                    <div className="h-full w-full md:w-[70%] lg:w-[65%]">
                        <FaqAccordion onToggle={handleToggle} onActiveChange={setIsActive} />
                    </div>
                </div>
            </div>

            <FaqFooterBar />
        </section>
    );
}