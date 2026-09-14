import { SponsEnergy } from "./SponsEnergy";
import { SponsHeader } from "./SponsHeader";
import { SponsHeadset } from "./SponsHeadset";
import { SponsHealth } from "./SponsHealth";

export function Spons() {
  return (
    <section id="spons" className="relative flex min-h-[100svh] flex-col max-sm:min-h-[75svh] max-sm:pb-[8vh] max-sm:pt-[4vh]">
      <SponsHeader />

      {/* Health + Energy */}
      <div className="relative z-10 mt-[7vh] flex w-full items-center justify-between px-[clamp(24px,5.2vw,75px)] max-sm:mt-[5vh] max-sm:justify-center max-sm:gap-[14vw]">
        <SponsHealth />
        <SponsEnergy />
      </div>

      {/* Headset */}
      <div className="relative z-10 -mt-[14vh] flex w-full justify-center max-sm:my-auto max-sm:mt-[12vh] max-sm:px-4 sm:-mt-[4vh] md:-mt-[5vh] lg:-mt-[8vh] lg:pb-[4vh] xl:-mt-[12vh]">
        <SponsHeadset />
      </div>

      {/* Bottom grid — behind the headset */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 hidden w-full justify-center sm:flex">
        <img
          src="/spons/grid.svg"
          alt=""
          aria-hidden
          className="h-auto w-[170%] max-w-none"
        />
      </div>
    </section>
  );
}
