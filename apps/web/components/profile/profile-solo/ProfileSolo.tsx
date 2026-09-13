import { Starfield } from "../../hero/Starfield";
import { PlayerPassTicket } from "./PlayerPassTicket";
import { ProfileSoloTitle } from "./ProfileSoloTitle";

export function ProfileSolo() {
  return (
    <main className="relative isolate min-h-screen w-full overflow-x-hidden bg-[#08080d] text-white flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 select-none">
      {/* Reusable Starfield background */}
      <Starfield />

      <div className="relative z-10 my-auto flex flex-col items-center justify-center gap-6 sm:gap-8 w-full max-w-7xl mx-auto">
        {/* Title Section */}
        <ProfileSoloTitle />

        {/* Ticket Container Section */}
        <div className="w-full flex justify-center px-2">
          <PlayerPassTicket />
        </div>
      </div>
    </main>
  );
}
