import { Starfield } from "@/components/hero/Starfield";
import { PixelButton } from "@/components/hero/PixelButton";

// Classic small-Mario, 12 wide x 16 tall. R = red, S = skin, H = hair/brown,
// B = boots/brown-dark, O = overalls/blue, W = white (eye).
const MARIO: string[] = [
  "..RRRRR.....",
  ".RRRRRRRRR..",
  ".HHSHSS....",
  ".HSHSSSSS..",
  ".HHSSSSSS..",
  "..SSSSSS...",
  ".RROORRR...",
  "RROORRRRRR.",
  "RRROORRRRR.",
  ".SSOORRO...",
  ".SSOOOOOS..",
  ".SSOOOOOS..",
  ".OOOOOOOO..",
  ".OOOO..OO..",
  ".BBB...BB..",
  "BBBB...BBB.",
];

const COLORS: Record<string, string> = {
  R: "#e70012",
  S: "#ffc9a3",
  H: "#7a3b00",
  B: "#7a3b00",
  O: "#0058f8",
  W: "#ffffff",
};

const PX = 4;

function marioShadow(): string {
  const parts: string[] = [];
  MARIO.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const c = COLORS[ch];
      if (c) parts.push(`${x * PX}px ${y * PX}px 0 0 ${c}`);
    });
  });
  return parts.join(",");
}

export default function NotFound() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#08080d] text-white">
      <Starfield />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="font-pixel text-[clamp(64px,18vw,140px)] leading-none text-[#FEDC02]">
          404
        </p>
        <h1 className="mt-4 font-pixel text-[clamp(12px,3.4vw,20px)] leading-relaxed tracking-[0.08em] text-white">
          WRONG WARP ZONE,
          <br />
          OPERATIVE
        </h1>
        <PixelButton
          label="BACK TO BASE"
          href="/"
          interaction="hero"
          className="mt-10 w-[240px]"
          labelClassName="text-xs"
        />
      </div>

      <div
        aria-hidden
        className="notfound-mario-runner pointer-events-none absolute bottom-[3px] left-0 z-10"
      >
        <div
          className="notfound-mario-bob"
          style={{
            width: 12 * PX,
            height: 16 * PX,
          }}
        >
          <div
            style={{
              width: PX,
              height: PX,
              boxShadow: marioShadow(),
              imageRendering: "pixelated",
            }}
          />
        </div>
        <div className="notfound-dust" />
        <div className="notfound-dust notfound-dust--late" />
      </div>
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 z-0 h-[3px] bg-[repeating-linear-gradient(90deg,#FEDC02_0_12px,transparent_12px_24px)] opacity-60"
      />

      <style>{`
        .notfound-mario-runner { animation: notfound-run 7s linear infinite; }
        .notfound-mario-bob { animation: notfound-hop 0.36s steps(2, jump-none) infinite; transform-origin: bottom center; }
        .notfound-dust {
          position: absolute;
          bottom: 2px;
          left: -6px;
          width: 6px;
          height: 6px;
          background: rgba(255, 255, 255, 0.55);
          animation: notfound-dust 0.5s ease-out infinite;
        }
        .notfound-dust--late { animation-delay: 0.25s; }
        @keyframes notfound-run {
          from { transform: translateX(-80px); }
          to { transform: translateX(100vw); }
        }
        @keyframes notfound-hop {
          0% { transform: translateY(0) rotate(-5deg) scaleY(0.96); }
          50% { transform: translateY(-14px) rotate(3deg) scaleY(1.05); }
          100% { transform: translateY(0) rotate(-5deg) scaleY(0.96); }
        }
        @keyframes notfound-dust {
          from { transform: translateX(0) scale(1); opacity: 0.6; }
          to { transform: translateX(-34px) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
