type Sparkle = {
  top: string;
  left: string;
  size: number;
  color: "pink" | "cyan";
  opacity?: number;
};

const desktopSparkles: Sparkle[] = [
  { top: "6%", left: "13%", size: 14, color: "pink" },
  { top: "22%", left: "17%", size: 10, color: "pink" },
  { top: "4%", left: "23%", size: 8, color: "pink" },
  { top: "48%", left: "4%", size: 12, color: "pink" },
  { top: "86%", left: "8%", size: 10, color: "pink" },
  { top: "94%", left: "4%", size: 8, color: "pink" },
  { top: "6%", left: "47%", size: 8, color: "pink" },
  { top: "11%", left: "58%", size: 14, color: "pink" },
  { top: "15%", left: "68%", size: 10, color: "cyan" },
  { top: "27%", left: "62%", size: 16, color: "pink" },
  { top: "10%", left: "84%", size: 12, color: "pink" },
  { top: "24%", left: "95%", size: 12, color: "pink" },
  { top: "36%", left: "67%", size: 10, color: "pink" },
  { top: "78%", left: "43%", size: 8, color: "pink" },
  { top: "94%", left: "42%", size: 8, color: "pink" },
  { top: "80%", left: "60%", size: 12, color: "pink" },
  { top: "96%", left: "84%", size: 8, color: "pink" },
  { top: "90%", left: "94%", size: 10, color: "pink" },
];

const mobileSparkles: Sparkle[] = [
  { top: "4%", left: "12%", size: 8, color: "pink" },
  { top: "12%", left: "78%", size: 8, color: "pink" },
  { top: "3%", left: "48%", size: 6, color: "pink" },
  { top: "22%", left: "62%", size: 8, color: "cyan" },
  { top: "20%", left: "6%", size: 6, color: "pink" },
  { top: "40%", left: "88%", size: 8, color: "pink" },
  { top: "62%", left: "10%", size: 6, color: "pink" },
  { top: "88%", left: "18%", size: 8, color: "pink" },
  { top: "83%", left: "48%", size: 6, color: "pink" },
  { top: "96%", left: "62%", size: 8, color: "pink" },
];

const colors: Record<Sparkle["color"], string> = {
  pink: "#fe6bd6",
  cyan: "#23eff1",
};

function Sparkle({ top, left, size, color, opacity = 1 }: Sparkle) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size,
        opacity,
      }}
      aria-hidden
    >
      <path
        d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"
        fill={colors[color]}
      />
    </svg>
  );
}

export function Sparkles({ variant }: { variant: "desktop" | "mobile" }) {
  const sparkles = variant === "desktop" ? desktopSparkles : mobileSparkles;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparkles.map((s, i) => (
        <Sparkle key={i} {...s} />
      ))}
    </div>
  );
}
