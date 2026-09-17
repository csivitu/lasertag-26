"use client";

import { useRouter } from "next/navigation";
import { QrCode } from "./QrCode";
import { PixelButton } from "@/components/hero/PixelButton";
import { useUserProfile } from "@/hooks/useUserProfile";

export function PlayerPassStubRight() {
  const router = useRouter();
  const { profile } = useUserProfile();
  const qrToken = profile?.activeRegistration?.qrToken ?? null;
  const changesLeft = Math.max(
    0,
    3 - (profile?.activeRegistration?.slotChangeCount ?? 0)
  );

  return (
    <div className="flex flex-col items-center justify-between h-full py-5 sm:py-6 px-4 sm:px-6 select-none">
      {/* SCAN TO PLAY Title */}
      <h3
        className="text-[#23eff1] font-mono font-bold text-sm tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] translate-x-6"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        SCAN TO PLAY
      </h3>

      {/* QR Code Container */}
      <div className="relative p-2 sm:p-2.5 bg-white rounded-md shadow-lg border-2 border-black my-auto translate-x-6">
        <QrCode className="w-24 h-24 sm:w-28 sm:h-28 md:w-28 md:h-28" value={qrToken} />
      </div>

      {/* CHANGE SLOT Button */}
      <div className="flex w-full max-w-[170px] flex-col items-center gap-1.5 translate-x-6">
        <PixelButton
          label="CHANGE SLOT"
          onClick={() => router.push("/slot-booking")}
          interaction="hero"
          className="w-full"
          labelClassName="text-[10px] sm:text-[11px] cursor-pointer"
        />
        <p className="font-pixel text-[8px] tracking-wider text-white uppercase text-center leading-relaxed">
          {changesLeft}/3 CHANGES LEFT
        </p>
      </div>
    </div>
  );
}
