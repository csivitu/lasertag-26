export default function TextLowerLeft() {
  return (
    <div className="flex flex-col gap-1 text-center sm:text-left">
      <h3
        className="text-transparent font-normal tracking-wider text-[20px] sm:text-[24px]"
        style={{
          fontFamily: "var(--ft-pixel), monospace",
          WebkitTextStroke: "1.5px #E5349E",
          lineHeight: "38px"
        }}
      >
        CSI-VIT
      </h3>
      
      <p
        className="text-white text-[10px] whitespace-nowrap sm:text-[16px]"
        style={{
          fontFamily: "var(--ft-pixel), monospace",
          lineHeight: "28px",
          letterSpacing: "0.02em"
        }}
      >
        when we build, it matters
      </p>
    </div>
  );
}
