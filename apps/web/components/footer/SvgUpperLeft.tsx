/* eslint-disable @next/next/no-img-element */
export default function SvgUpperLeft() {
  return (
    <div className="flex w-full select-none items-center justify-center mt-3 sm:mt-4">
      <div className="relative w-full translate-x-[2%] max-w-[400px] sm:max-w-[480px] md:max-w-[480px] lg:max-w-[750px] xl:max-w-[820px]">
        <img
          src="/footer/upper-left-group.svg"
          alt="Laser tag arcade cabinet"
          draggable={false}
          className="h-auto w-full select-none object-contain drop-shadow-[0_0_35px_rgba(237,43,132,0.2)]"
          fetchPriority="high"
        />

        <div
          className="pointer-events-none absolute"
          style={{
            left: "32%",
            top: "31.5%",
            width: "35.28%",
            height: "13.02%",
          }}
        >
          <img
            src="/footer/are-you-ready.svg"
            alt="ARE YOU READY?"
            draggable={false}
            className="h-full w-full select-none object-contain drop-shadow-[0_0_8px_rgba(254,220,2,0.5)]"
          />
        </div>
      </div>
    </div>
  );
}