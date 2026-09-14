import { ArcadeScene } from "./ArcadeScene";
import { ruleCards } from "./guidelines.data";
import { RuleCard } from "./RuleCard";

export function Guidelines() {
  return (
    <section
      id="guidelines"
      className="relative isolate flex min-h-0 h-auto flex-col overflow-x-hidden bg-transparent px-4 py-8 sm:px-8 sm:py-12 lg:min-h-[100svh] lg:h-[100svh] lg:overflow-hidden lg:px-[3.4vw] lg:py-[2svh]"
    >

      <div className="relative z-10 mx-auto flex w-full max-w-[1560px] min-w-0 flex-1 flex-col lg:min-h-0">
        <h2
          className="shrink-0 text-center font-heading text-[clamp(2.5rem,11.5vw,3.75rem)] tracking-[0.06em] text-guideline-yellow [text-shadow:-2px_0_0_var(--color-brand-pink)] sm:text-[clamp(2.75rem,8vw,4.75rem)] md:text-[clamp(3.5rem,7vw,5.75rem)] lg:text-[112px] lg:leading-[0.9] lg:tracking-[0.06em] lg:[text-shadow:-5px_0_0_var(--color-brand-pink)]"
        >
          GUIDELINES
        </h2>
        <p className="mt-1 shrink-0 text-center font-pixel text-[8px] tracking-normal text-guideline-cyan sm:text-xs sm:tracking-wide lg:mt-[0.8svh] lg:text-[clamp(0.85rem,1.85svh,1.35rem)] lg:tracking-[0.1em]">
          PLAY SMART. PLAY FAIR. PLAY ON.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:gap-6 lg:mt-[1.2svh] xl:mt-[1.8svh] lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)] lg:items-stretch lg:gap-6 xl:gap-10">
          {/* Absent on mobile in Figma, not just shrunk — the mobile frame has no equivalent node. */}
          <div className="hidden min-h-0 items-center justify-center lg:flex lg:h-full">
            <ArcadeScene />
          </div>
          <div className="flex flex-col gap-4 sm:gap-5 lg:min-h-0 lg:flex-1 lg:gap-[1.2svh] xl:gap-[1.8svh] lg:overflow-hidden lg:h-full">
            {ruleCards.map((card) => (
              <RuleCard key={card.id} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
