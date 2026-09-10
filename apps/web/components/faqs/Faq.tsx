import { FaqAccordion } from "./FaqAccordion";
import { FaqFooterBar } from "./FaqFooterBar";
import { FaqHeader } from "./FaqHeader";
import { FaqSideArt } from "./FaqSideArt";
import { Starfield } from "../hero/Starfield";

export function Faq() {
    return (
        <section className="relative isolate flex h-[100svh] flex-col overflow-hidden bg-ink">
            <Starfield />

            {/* Side art — absolutely positioned, desktop only */}
            <div className="pointer-events-none absolute inset-0 bottom-5 z-[5] hidden lg:block sm:bottom-6">
                <FaqSideArt />
            </div>

            <div className="relative z-10 flex flex-1 min-h-0 flex-col">
                <FaqHeader />

                {/* Mobile ralph image */}
                <div className="flex justify-center pt-6 lg:hidden">
                    <img
                        src="/faq/ralph.png"
                        alt="Wreck-It Ralph pixel art"
                        className="h-auto w-32 sm:w-40"
                        style={{ imageRendering: "pixelated" }}
                    />
                </div>

                <div className="mx-auto flex w-full max-w-6xl flex-1 items-start px-5 pt-2 pb-4 sm:px-8 lg:items-center lg:pt-0 lg:px-12">
                    <div className="h-full w-full lg:w-[65%]">
                        <FaqAccordion />
                    </div>
                </div>
            </div>

            <FaqFooterBar />
        </section>
    );
}