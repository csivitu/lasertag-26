// Shared player-count label: blue profile icon + Oxanium semibold label.
// Used by both solo ("1 PLAYER") and team ("MAX 5 PLAYERS") cards,
// on desktop (md) and mobile (sm).
export function PlayerCountLabel({
  text,
  size = "md",
}: {
  text: string;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "h-5" : "h-8";
  const textSize = size === "sm" ? "text-sm" : "text-xl";
  return (
    <div className="flex items-center gap-3 mt-1">
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className={`${iconSize} w-auto shrink-0`}
        fill="#23eff1"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
      <span
        className={`font-body font-semibold text-[#f5d506] ${textSize} uppercase tracking-widest`}
      >
        {text}
      </span>
    </div>
  );
}
