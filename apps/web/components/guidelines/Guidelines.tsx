import { Starfield } from "../hero/Starfield";
import { ArcadeScene } from "./ArcadeScene";
import { ruleCards } from "./guidelines.data";
import { RuleCard } from "./RuleCard";

export function Guidelines() {
  return (
    <section
      id="guidelines"
      className="relative isolate flex h-[100svh] flex-col overflow-hidden bg-ink px-6 py-[2svh] sm:px-8 lg:px-[3.4vw]"
    >
      <Starfield />

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col">
        <h2
          className="shrink-0 text-center font-heading text-[clamp(1.5rem,6.5svh,6.25rem)] tracking-[0.08em] text-guideline-yellow"
          style={{ textShadow: "-5px 0 0 var(--color-brand-pink)" }}
        >
          GUIDELINES
        </h2>
        <p className="mt-[0.5svh] shrink-0 text-center font-pixel text-[clamp(0.55rem,1.7svh,2rem)] tracking-[0.08em] text-guideline-cyan">
          PLAY SMART. PLAY FAIR. PLAY ON.
        </p>

        <div className="mt-[2svh] grid min-h-0 flex-1 gap-[2svh] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-stretch lg:gap-8">
          {/* Absent on mobile in Figma, not just shrunk — the mobile frame has no equivalent node. */}
          <div className="hidden min-h-0 items-center justify-center lg:flex lg:h-full">
            <ArcadeScene />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-[2svh] overflow-hidden lg:h-full">
            {ruleCards.map((card) => (
              <RuleCard key={card.id} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
