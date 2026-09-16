export function HeroTitle() {
  // The arcade font's "A" carries a much wider left side-bearing than any
  // other glyph, so every letter before an A (L→A, T→A) reads as a gap.
  // Pull each A back individually; R gets the deliberate word gap before T.
  const A_PULL = "-ml-[0.08em]";
  const WORD_GAP = "mr-[0.12em]";
  return (
    <h1 aria-label="LASERTAG" className="m-0 w-full overflow-visible text-center">
      <span aria-hidden className="inline-block pr-[0.05em] [letter-spacing:-0.027em]">
        {"LASERTAG".split("").map((ch, i) => (
          <span
            key={i}
            className={`hero-wordmark inline-block${ch === "A" ? ` ${A_PULL}` : ""}${ch === "R" ? ` ${WORD_GAP}` : ""}`}
          >
            {ch}
          </span>
        ))}
      </span>
    </h1>
  );
}
