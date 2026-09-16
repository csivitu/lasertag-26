"use client";

import { useRouter } from "next/navigation";
import { QrCode } from "./QrCode";
import { PlayerPassStubLeft } from "./PlayerPassStubLeft";
import { PlayerPassDetails } from "./PlayerPassDetails";
import { PlayerPassStubRight } from "./PlayerPassStubRight";
import { PassDetailItem } from "../shared/PassDetailItem";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSession } from "@/lib/auth-client";
import { formatPassDate, formatPassTime } from "@/lib/formatPassDateTime";

export function PlayerPassTicket() {
  const router = useRouter();
  const { data: session } = useSession();
  const { profile } = useUserProfile();

  const playerName = profile?.name || session?.user?.name || "OPERATIVE";
  const playerEmail = profile?.email || session?.user?.email || "N/A";
  const playerPhone = profile?.phone || "N/A";
  const regNo = profile?.regNo || profile?.activeRegistration?.regNo || "N/A";
  const rawDate = profile?.activeRegistration?.slot?.slotDate;
  const rawTime = profile?.activeRegistration?.slot?.slotTime;

  const slotDate = formatPassDate(rawDate);
  const slotTime = formatPassTime(rawTime);

  return (
    <div className="w-full max-w-[1100px] mx-auto px-2">
      {/* MOBILE TICKET (< lg) */}
      <div className="lg:hidden relative w-full max-w-sm mx-auto border-[3px] border-[#FEDC02] rounded-[1.5rem] bg-[#0b0b10] flex flex-col shadow-2xl">
        {/* Details Section */}
        <div className="flex flex-col gap-4 px-4 pt-8 pb-6 w-full">
          <PassDetailItem
            icon="/profile/profile-solo/playericon.svg"
            label="PLAYER"
            value={playerName}
          />
          <PassDetailItem
            icon="/profile/profile-solo/email.svg"
            label="EMAIL ID"
            value={playerEmail}
          />
          <PassDetailItem
            icon="/profile/profile-solo/regno.svg"
            label="REG. NO."
            value={regNo}
          />
          <PassDetailItem
            icon="/profile/profile-solo/Group 741.svg"
            label="PHONE NO."
            value={playerPhone}
          />
          <PassDetailItem
            icon="/profile/profile-solo/Group 742.svg"
            label="DATE"
            value={slotDate}
            multiline
          />
          <PassDetailItem
            icon="/profile/profile-solo/timeslot.svg"
            label="TIME SLOT"
            value={slotTime}
            multiline
          />
        </div>

        {/* Dashed Divider with Notches */}
        <div className="relative w-full h-8 flex items-center">
          <div className="absolute -left-[3px] w-4 h-8 bg-[#08080d] border-[3px] border-l-0 border-[#FEDC02] rounded-r-full z-10" />
          <div className="w-full mx-6 border-b-[3px] border-dashed border-[#FEDC02] opacity-90" />
          <div className="absolute -right-[3px] w-4 h-8 bg-[#08080d] border-[3px] border-r-0 border-[#FEDC02] rounded-l-full z-10" />
        </div>

        {/* QR Code & Button Section */}
        <div className="flex flex-col items-center justify-center gap-6 px-6 pb-10 pt-6 w-full">
          <div className="relative p-2 sm:p-2.5 bg-white rounded-md shadow-lg border-2 border-black">
            <QrCode className="w-32 h-32" />
          </div>

          <button
            onClick={() => router.push("/slots")}
            className="w-full max-w-[240px] py-3.5 px-6 rounded-xl font-black text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_0_20px_rgba(254,220,2,0.3)] hover:shadow-[0_0_30px_rgba(254,220,2,0.5)] active:scale-95 bg-[#FEDC02] text-black hover:bg-[#ffe53b]"
          >
            CHANGE SLOT
          </button>
        </div>
      </div>

      {/* DESKTOP / TABLET TICKET (>= lg) */}
      <div className="hidden lg:flex relative items-stretch justify-center w-full">
        {/* Left Tear-off Stub (QR + Branding) */}
        <PlayerPassStubLeft />

        {/* Center Details Section */}
        <div className="flex-1 min-w-0 max-w-[580px] z-10">
          <PlayerPassDetails />
        </div>

        {/* Right Action Stub */}
        <PlayerPassStubRight />
      </div>
    </div>
  );
}
