import { Starfield } from "../hero/Starfield";
import { ArcadeScene } from "./ArcadeScene";
import { ruleCards } from "./guidelines.data";
import { RuleCard } from "./RuleCard";

export function Guidelines() {
  return (
    <section
      id="guidelines"
      className="relative isolate overflow-hidden bg-ink px-6 py-16 sm:px-8 lg:px-[3.4vw] lg:py-24"
    >
      <Starfield />

      <div className="relative z-10 mx-auto max-w-[1440px]">
        <h2
          className="text-center font-heading text-[clamp(2.5rem,9vw,6.25rem)] tracking-[0.1em] text-guideline-yellow"
          style={{ textShadow: "-5px 0 0 var(--color-brand-pink)" }}
        >
          GUIDELINES
        </h2>
        <p className="mt-3 text-center font-pixel text-[clamp(0.8rem,2vw,2rem)] tracking-[0.1em] text-guideline-cyan">
          PLAY SMART. PLAY FAIR. PLAY ON.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center lg:gap-8">
          {/* Absent on mobile in Figma, not just shrunk — the mobile frame has no equivalent node. */}
          <div className="hidden justify-center lg:flex lg:justify-start lg:-ml-[3.4vw]">
            <ArcadeScene />
          </div>
          <div className="flex flex-col gap-8">
            {ruleCards.map((card) => (
              <RuleCard key={card.id} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
