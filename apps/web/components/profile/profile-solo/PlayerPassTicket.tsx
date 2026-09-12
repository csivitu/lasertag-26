import Image from "next/image";
import { PlayerPassDetails } from "./PlayerPassDetails";
import { PlayerPassStubLeft } from "./PlayerPassStubLeft";
import { PlayerPassStubRight } from "./PlayerPassStubRight";
import { QrCode } from "./QrCode";

function MobileDetailRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-4 pl-2">
      <div className="relative w-10 h-10 shrink-0">
        <Image src={icon} alt="" fill className="object-contain" />
      </div>
      <div className="relative h-11 w-48">
        <Image src={text} alt="" fill className="object-contain object-left" />
      </div>
    </div>
  );
}

export function PlayerPassTicket() {
  return (
    <div className="w-full max-w-[1100px] mx-auto px-2">
      
      {/* MOBILE TICKET (< lg) */}
      <div className="lg:hidden relative w-full max-w-sm mx-auto border-[3px] border-[#FEDC02] rounded-[1.5rem] bg-[#0b0b10] flex flex-col">
        {/* Details Section */}
        <div className="flex flex-col gap-5 px-4 pt-10 pb-6 w-full">
          <MobileDetailRow icon="/profile/profile-solo/playericon.svg" text="/profile/profile-solo/Group 738.svg" />
          <MobileDetailRow icon="/profile/profile-solo/email.svg" text="/profile/profile-solo/Group 739.svg" />
          <MobileDetailRow icon="/profile/profile-solo/regno.svg" text="/profile/profile-solo/Group 740.svg" />
          <MobileDetailRow icon="/profile/profile-solo/Group 741.svg" text="/profile/profile-solo/Group 749.svg" />
          <MobileDetailRow icon="/profile/profile-solo/Group 742.svg" text="/profile/profile-solo/Group 745.svg" />
          <MobileDetailRow icon="/profile/profile-solo/timeslot.svg" text="/profile/profile-solo/Group 747.svg" />
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
            type="button"
            className="w-full max-w-[180px] py-2.5 px-4 bg-[#f949cc] hover:bg-[#ff5be2] active:translate-y-[1px] text-white text-[11px] font-bold rounded-full border-[3px] border-[#ff7beb] shadow-[0_4px_0_#9c187d] transition-all uppercase tracking-wider text-center"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            CHANGE SLOT
          </button>
        </div>
      </div>

      {/* DESKTOP TICKET (>= lg) */}
      <div className="hidden lg:block relative w-full aspect-[1285/622] min-h-[540px]">
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
        <div className="absolute inset-[3.5%] z-10 grid grid-cols-[12%_1px_62%_1px_24%] items-stretch bg-black rounded-lg overflow-hidden p-2">
          {/* Left stub: Vertical LASERTAG */}
          <div className="h-full">
            <PlayerPassStubLeft />
          </div>

          {/* Solid Divider Line (Left) */}
          <div className="relative h-full w-full opacity-90">
            <Image
              src="/profile/profile-solo/Line 115.svg"
              alt=""
              fill
              className="object-cover"
            />
          </div>

          {/* Main Ticket Details Area */}
          <div className="flex-1">
            <PlayerPassDetails />
          </div>

          {/* Dashed Stub Divider Line (Right) */}
          <div className="relative h-full w-full opacity-80">
            <Image
              src="/profile/profile-solo/Group 629.svg"
              alt=""
              fill
              className="object-cover"
            />
          </div>

          {/* Right stub: SCAN TO PLAY & QR Code & CHANGE SLOT button */}
          <div className="h-full">
            <PlayerPassStubRight />
          </div>
        </div>
      </div>

    </div>
  );
}
