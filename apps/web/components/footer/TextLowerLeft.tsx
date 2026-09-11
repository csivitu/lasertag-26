export default function TextLowerLeft() {
  return (
    <div className="flex flex-col gap-2 text-center sm:text-left">
      <h3
        className="text-transparent font-bold tracking-wider text-[24px] sm:text-[30px]"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          WebkitTextStroke: "2px #E5349E",
          lineHeight: "38px"
        }}
      >
        CSI-VIT
      </h3>
      
      <p
        className="text-white text-[14px] sm:text-[20px]"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          lineHeight: "28px",
          letterSpacing: "0.02em"
        }}
      >
        when we build, it matters
      </p>
    </div>
  );
}
