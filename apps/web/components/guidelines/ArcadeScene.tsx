import Image from "next/image";

/**
 * The monitor's own Figma node doesn't bound the controllers — they're
 * siblings, cable-linked but not children — so the scene's real extent is
 * the union of all three: 0,0 to 621,645.37 in monitor-local units. Every
 * offset below is a percentage of that box, not of the monitor alone.
 */
export function ArcadeScene() {
  return (
    <div className="relative aspect-[621/645.37] w-full max-w-[560px]">
      <div className="absolute left-0 top-0 h-[83.74%] w-full">
        <Image src="/guidelines/arcade-monitor.svg" alt="" fill loading="lazy" sizes="560px" />
      </div>
      <div className="absolute left-[27.65%] top-[66.94%] h-[21.71%] w-[25.15%]">
        <Image src="/guidelines/controller-yellow.svg" alt="" fill loading="lazy" sizes="150px" />
      </div>
      <div className="absolute left-[49.11%] top-[82.55%] h-[17.46%] w-[21.86%]">
        <Image src="/guidelines/controller-cyan.svg" alt="" fill loading="lazy" sizes="130px" />
      </div>
    </div>
  );
}
