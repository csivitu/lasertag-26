export function SponsHeader() {
  return (
    <div
      className="
        flex
        w-full
        flex-col
        items-center
        pt-[6.5vh]
        sm:pt-[6.5vh]
      "
    >
      <p
        className="
          m-0
          font-pixel
          text-[clamp(14px,1.55vw,32px)]
          font-normal
          leading-[1.34]
          tracking-[0.1em]
          text-center
          text-[#02CFE9]
        "
      >
        POWERED BY
      </p>

      <h2
        className="
          m-0
          -mt-[0.05em]
          font-heading
          text-[clamp(42px,5.4vw,100px)]
          font-normal
          leading-[1.15]
          tracking-[0.1em]
          text-center
          text-[#FEDC02]
          [text-shadow:-5px_0_0_#E5349E]
        "
      >
        OUR SPONSOR
      </h2>
    </div>
  );
}