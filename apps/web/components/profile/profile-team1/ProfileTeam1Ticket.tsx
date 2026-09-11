import Image from "next/image";
import { PlayerPassStubLeft } from "../profile-solo/PlayerPassStubLeft";
import { PlayerInfoSection } from "./PlayerInfoSection";
import { TeamMembersSection } from "./TeamMembersSection";
import { TeamCodeSection } from "./TeamCodeSection";

export function ProfileTeam1Ticket() {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-2">
      {/* MOBILE / TABLET TICKET (< lg) */}
      <div className="lg:hidden relative w-full max-w-md mx-auto border-[3px] border-[#FEDC02] rounded-[1.5rem] bg-[#0b0b10] flex flex-col shadow-2xl">
        {/* Section 1: PLAYER INFO */}
        <div className="pt-6 pb-4 px-3 w-full">
          <PlayerInfoSection />
        </div>

        {/* Dashed Divider with Notches 1 */}
        <div className="relative w-full h-8 flex items-center">
          <div className="absolute -left-[3px] w-4 h-8 bg-[#08080d] border-[3px] border-l-0 border-[#FEDC02] rounded-r-full z-10" />
          <div className="w-full mx-6 border-b-[2px] border-dashed border-[#FEDC02] opacity-80" />
          <div className="absolute -right-[3px] w-4 h-8 bg-[#08080d] border-[3px] border-r-0 border-[#FEDC02] rounded-l-full z-10" />
        </div>

        {/* Section 2: TEAM MEMBERS */}
        <div className="py-4 px-3 w-full">
          <TeamMembersSection />
        </div>

        {/* Dashed Divider with Notches 2 */}
        <div className="relative w-full h-8 flex items-center">
          <div className="absolute -left-[3px] w-4 h-8 bg-[#08080d] border-[3px] border-l-0 border-[#FEDC02] rounded-r-full z-10" />
          <div className="w-full mx-6 border-b-[2px] border-dashed border-[#FEDC02] opacity-80" />
          <div className="absolute -right-[3px] w-4 h-8 bg-[#08080d] border-[3px] border-r-0 border-[#FEDC02] rounded-l-full z-10" />
        </div>

        {/* Section 3: TEAM CODE & BOOK SLOT */}
        <div className="py-6 px-4 w-full">
          <TeamCodeSection />
        </div>
      </div>

      {/* DESKTOP TICKET (>= lg) */}
      <div className="hidden lg:block relative w-full aspect-[1285/622] min-h-[520px] select-none">
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
        <div className="absolute inset-[3.5%] z-10 grid grid-cols-[10%_1px_32%_1px_34%_1px_23%] items-stretch bg-black rounded-lg overflow-hidden p-2">
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

          {/* Column 1: PLAYER INFO */}
          <div className="h-full overflow-hidden">
            <PlayerInfoSection />
          </div>

          {/* Dashed Divider Line (Middle 1) */}
          <div className="relative h-full w-full flex justify-center items-center">
            <div className="h-[88%] w-[1px] border-r-[2px] border-dashed border-[#FEDC02] opacity-80" />
          </div>

          {/* Column 2: TEAM MEMBERS */}
          <div className="h-full overflow-hidden">
            <TeamMembersSection />
          </div>

          {/* Dashed Divider Line (Middle 2) */}
          <div className="relative h-full w-full opacity-80">
            <Image
              src="/profile/profile-solo/Group 629.svg"
              alt=""
              fill
              className="object-cover"
            />
          </div>

          {/* Column 3: TEAM CODE & BOOK SLOT */}
          <div className="h-full overflow-hidden">
            <TeamCodeSection />
          </div>
        </div>
      </div>
    </div>
  );
}
