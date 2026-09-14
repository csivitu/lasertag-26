export function SponsHeader() {
  return (
    <div
      className="
        flex
        w-full
        flex-col
        items-center
        pt-[1.5vh]
        sm:pt-[1.5vh]
      "
    >
      <p
        className="
          m-0
          font-pixel
          text-[clamp(12px,1.3vw,28px)]
          font-normal
          leading-[1.34]
          tracking-[0.1em]
          text-center
          text-[#02CFE9]
          pt-[0.6em]
          pb-[0.5em]
        "
      >
        POWERED BY
      </p>

      <h2
        className="
          m-0
          -mt-[0.05em]
          font-heading
          text-[clamp(2.5rem,11.5vw,3.75rem)]
          font-normal
          leading-[1.15]
          tracking-[0.06em]
          text-center
          text-[#FEDC02]
          [text-shadow:-2px_0_0_#E5349E]
          sm:text-[clamp(3rem,9vw,4.75rem)]
          md:text-[clamp(3.75rem,7.5vw,5.75rem)]
          lg:text-[112px] lg:leading-[0.9] lg:tracking-[0.06em] lg:[text-shadow:-5px_0_0_#E5349E]
        "
      >
        OUR SPONSOR
      </h2>
    </div>
  );
}