import { Starfield } from "../hero/Starfield";
import { ArcadeScene } from "./ArcadeScene";
import { ruleCards } from "./guidelines.data";
import { RuleCard } from "./RuleCard";

export function Guidelines() {
  return (
    <section
      id="guidelines"
      className="relative isolate flex min-h-[100svh] h-auto flex-col overflow-x-hidden bg-ink px-4 py-6 sm:px-8 sm:py-8 lg:h-[100svh] lg:overflow-hidden lg:px-[3.4vw] lg:py-[2svh]"
    >
      <Starfield />

      <div className="relative z-10 mx-auto flex w-full max-w-[1536px] min-w-0 flex-1 flex-col lg:min-h-0">
        <h2
          className="shrink-0 text-center font-heading text-[clamp(2rem,9vw,3.75rem)] tracking-[0.06em] text-guideline-yellow lg:text-[112px] lg:leading-[0.95] lg:tracking-[0.06em]"
          style={{ textShadow: "-5px 0 0 var(--color-brand-pink)" }}
        >
          GUIDELINES
        </h2>
        <p className="mt-1 shrink-0 text-center font-pixel text-[clamp(0.48rem,2.3vw,0.75rem)] tracking-wide text-guideline-cyan sm:text-xs lg:mt-[0.5svh] lg:text-[clamp(0.65rem,1.7svh,2rem)] lg:tracking-[0.08em]">
          PLAY SMART. PLAY FAIR. PLAY ON.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:gap-6 lg:mt-[2svh] lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)] lg:items-stretch lg:gap-8">
          {/* Absent on mobile in Figma, not just shrunk — the mobile frame has no equivalent node. */}
          <div className="hidden min-h-0 items-center justify-center lg:flex lg:h-full">
            <ArcadeScene />
          </div>
          <div className="flex flex-col gap-4 sm:gap-5 lg:min-h-0 lg:flex-1 lg:gap-[2svh] lg:overflow-hidden lg:h-full">
            {ruleCards.map((card) => (
              <RuleCard key={card.id} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
