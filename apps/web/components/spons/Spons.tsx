import { SponsEnergy } from "./SponsEnergy";
import { SponsHeader } from "./SponsHeader";
import { SponsHeadset } from "./SponsHeadset";
import { SponsHealth } from "./SponsHealth";

export function Spons() {
  return (
    <section id="spons" className="relative flex min-h-[100svh] flex-col bg-ink">
      <SponsHeader />

      {/* Health + Energy */}
      <div className="relative z-10 mt-[8vh] flex w-full items-center justify-between px-[clamp(24px,5.2vw,75px)] max-sm:justify-center max-sm:gap-[6vw]">
        <SponsHealth />
        <SponsEnergy />
      </div>

      {/* Headset */}
      <div className="relative z-0 -mt-[11vh] flex w-full justify-center max-sm:mt-[6vh] max-sm:px-4">
        <SponsHeadset />
      </div>
    </section>
  );
}