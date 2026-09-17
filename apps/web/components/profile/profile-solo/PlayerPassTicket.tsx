"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { QrCode } from "./QrCode";
import { PixelButton } from "@/components/hero/PixelButton";
import { PlayerPassStubLeft } from "./PlayerPassStubLeft";
import { PlayerPassDetails } from "./PlayerPassDetails";
import { PlayerPassStubRight } from "./PlayerPassStubRight";
import { PassDetailItem } from "../shared/PassDetailItem";
import { EditablePlayerName } from "./EditablePlayerName";
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
  const regNo = profile?.regNumber || "N/A";
  const rawDate = profile?.activeRegistration?.slot?.slotDate;
  const rawTime = profile?.activeRegistration?.slot?.slotTime;

  const slotDate = formatPassDate(rawDate);
  const slotTime = formatPassTime(rawTime);
  const qrToken = profile?.activeRegistration?.qrToken ?? null;
  const changesLeft = Math.max(
    0,
    3 - (profile?.activeRegistration?.slotChangeCount ?? 0)
  );

  return (
    <div className="w-full max-w-[1100px] mx-auto px-2">
      {/* MOBILE TICKET (< lg) */}
      <div className="lg:hidden relative w-full max-w-sm mx-auto border-[3px] border-[#FEDC02] rounded-[1.5rem] bg-[#0b0b10] flex flex-col shadow-2xl">
        {/* Details Section */}
        <div className="flex flex-col gap-4 px-4 pt-8 pb-6 w-full">
          <EditablePlayerName value={playerName} />
          <PassDetailItem
            icon="/profile/profile-solo/email.svg"
            label="EMAIL ID"
            value={playerEmail}
            wrap
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
            <QrCode className="w-32 h-32" value={qrToken} />
          </div>
          <div className="flex w-full max-w-[180px] flex-col items-center gap-1.5">
            <PixelButton
              label="CHANGE SLOT"
              onClick={() => router.push("/slot-booking")}
              interaction="hero"
              className="w-full"
              labelClassName="text-[11px] cursor-pointer"
            />
            <p className="font-pixel text-[8px] tracking-wider text-white uppercase text-center leading-relaxed">
              {changesLeft}/3 CHANGES LEFT
            </p>
          </div>
        </div>
      </div>

      {/* DESKTOP TICKET (>= lg) */}
      <div className="hidden lg:block relative w-full aspect-[1100/533] min-h-[460px] select-none">
        {/* Outer yellow border ticket frame (Group 628.svg) */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <Image
            src="/profile/profile-solo/Group 628.svg"
            alt="Ticket Frame"
            fill
            priority
            className="object-contain"
          />
        </div>

        {/* Inner ticket content container aligned inside the border frame */}
        <div className="absolute inset-[3.5%] z-10 grid grid-cols-[11%_1px_62%_1px_26%] items-stretch bg-black rounded-lg overflow-hidden p-2">
          {/* Left stub: Vertical LASERTAG */}
          <div className="h-full">
            <PlayerPassStubLeft />
          </div>

          {/* Divider Line (Left) */}
          <div className="relative h-full w-full opacity-90">
            <Image
              src="/profile/profile-solo/Line 115.svg"
              alt=""
              fill
              className="object-cover"
            />
          </div>

          {/* Center main area: 3x2 Grid */}
          <div className="h-full overflow-hidden">
            <PlayerPassDetails />
          </div>

          {/* Divider Line (Right) */}
          <div className="relative h-full w-full opacity-80">
            <Image
              src="/profile/profile-solo/Group 629.svg"
              alt=""
              fill
              className="object-cover"
            />
          </div>

          {/* Right stub: QR & Action Button */}
          <div className="h-full overflow-hidden">
            <PlayerPassStubRight />
          </div>
        </div>
      </div>
    </div>
  );
}
