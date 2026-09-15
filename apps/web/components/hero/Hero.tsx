import type { CSSProperties } from "react";

import { HeroGun } from "./HeroGun";
import { HeroHeader } from "./HeroHeader";
import { HeroTagline } from "./HeroTagline";
import { HeroTitle } from "./HeroTitle";
import { RegisterButton } from "./RegisterButton";

export function Hero() {
  return (
    <section
      id="home"
      className="relative isolate grid min-h-[100svh] grid-rows-[auto_auto_1fr] overflow-hidden bg-transparent lg:grid-cols-2 lg:grid-rows-[auto_1fr]"
      style={{ "--hero-gutter": "clamp(24px, 3.4vw, 72px)" } as CSSProperties}
    >
      <div className="lg:col-span-2">
        <HeroHeader />
      </div>

      <div className="relative z-10 row-start-2 flex flex-col items-center px-5 pt-24 sm:px-8 sm:pt-28 lg:col-start-2 lg:row-start-2 lg:justify-center lg:px-0 lg:pr-[var(--hero-gutter)] lg:pt-0 lg:-translate-x-[10vw]">
        <HeroTitle />
        <HeroTagline />
        <div className="mt-4 w-[clamp(210px,53vw,340px)] lg:mt-[7vh] lg:w-[min(25vw,350px)]">
          <RegisterButton />
        </div>
      </div>

      <div className="relative row-start-3 min-h-[42svh] lg:col-start-1 lg:row-start-2 lg:min-h-0">
        <HeroGun />
      </div>
    </section>
  );
}
