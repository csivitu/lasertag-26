import { Starfield } from "@/components/hero/Starfield";
import { ProfileTeamTitle } from "./ProfileTeamTitle";
import { ProfileTeam1Ticket } from "./ProfileTeam1Ticket";

export function ProfileTeam1() {
  return (
    <main className="relative isolate min-h-screen w-full overflow-x-hidden bg-[#08080d] text-white flex flex-col justify-between py-6 sm:py-8 px-2 sm:px-6 lg:px-8 select-none">
      {/* Background Starfield */}
      <Starfield />

      <div className="relative z-10 my-auto flex flex-col items-center justify-center gap-5 sm:gap-7 w-full max-w-7xl mx-auto">
        {/* Title Section */}
        <ProfileTeamTitle />

        {/* Ticket Container Section */}
        <div className="w-full flex justify-center">
          <ProfileTeam1Ticket />
        </div>
      </div>
    </main>
  );
}
