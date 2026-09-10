import { SponsEnergy } from "./SponsEnergy";
import { SponsHeader } from "./SponsHeader";
import { SponsHeadset } from "./SponsHeadset";
import { SponsHealth } from "./SponsHealth";

export function Spons() {
  return (
    <section className="relative flex min-h-[100svh] flex-col bg-ink">
      <SponsHeader />

      <div className="relative z-10 mt-[8vh] flex w-full items-center justify-between px-[clamp(24px,5.2vw,75px)]">
        <SponsHealth />
        <SponsEnergy />
      </div>

      <div className="relative z-0 -mt-[11.5vh] flex w-full justify-center">
        <SponsHeadset />
      </div>
    </section>
  );
}