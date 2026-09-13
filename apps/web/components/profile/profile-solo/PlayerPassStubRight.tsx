import { QrCode } from "./QrCode";

export function PlayerPassStubRight() {
  return (
    <div className="flex flex-col items-center justify-between h-full py-8 px-7 select-none ">
      {/* SCAN TO PLAY Title */}
      <h3
        className="text-[#23eff1] font-mono font-bold text-sm tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] translate-x-6"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        SCAN TO PLAY
      </h3>

      {/* QR Code Container */}
      <div className="relative p-2 sm:p-2.5 bg-white rounded-md shadow-lg border-2 border-black my-auto translate-x-6">
        <QrCode className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32" />
      </div>

      {/* CHANGE SLOT Button */}
      <button
        type="button"
        className="w-full max-w-[170px] py-2 px-3 bg-[#f949cc] hover:bg-[#ff5be2] active:translate-y-[1px] translate-x-6 text-white text-[10px] sm:text-[11px] font-bold rounded-full border-2 border-[#ff7beb] shadow-[0_3px_0_#9c187d] transition-all uppercase tracking-wider text-center"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        CHANGE SLOT
      </button>
    </div>
  );
}
