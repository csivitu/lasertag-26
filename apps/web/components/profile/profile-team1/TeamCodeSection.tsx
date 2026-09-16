"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSession, apiBaseUrl } from "@/lib/auth-client";

export function TeamCodeSection() {
  const router = useRouter();
  const { profile, refetch } = useUserProfile();
  const { data: session } = useSession();
  const [teamCode, setTeamCode] = useState<string>("");
  const [memberCount, setMemberCount] = useState<number>(1);
  const [isLeader, setIsLeader] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.team) {
      setTeamCode(profile.team.teamCode);
      setMemberCount(profile.team.memberCount);
      setIsLeader(Boolean(profile.team.isLeader));
      return;
    }

    try {
      const activeTeamStr = sessionStorage.getItem("lasertag_active_team");
      if (activeTeamStr) {
        const teamObj = JSON.parse(activeTeamStr);
        setTeamCode(teamObj.teamCode || "");
        setMemberCount(teamObj.memberCount || 1);
        setIsLeader(Boolean(teamObj.isLeader));
        return;
      }
    } catch {
      // ignore
    }

    if (session?.user) {
      fetch(`${apiBaseUrl}/users/me/profile`, { credentials: "include" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.data?.team) {
            setTeamCode(data.data.team.teamCode || "");
            setMemberCount(data.data.team.memberCount || 1);
            setIsLeader(Boolean(data.data.team.isLeader));
          }
        })
        .catch(() => {});
    }
  }, [profile, session]);

  const handleCopy = () => {
    if (teamCode) {
      navigator.clipboard.writeText(teamCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConvertToSolo = async () => {
    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const targetTeam = teamCode || profile?.team?.teamCode;
      const res = await fetch(`${apiBaseUrl}/teams/${targetTeam}/convert-to-solo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user_id: session?.user?.id || profile?.id,
          team_id: targetTeam,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to switch to solo mode");
      }

      // Clear session storage and mark solo
      sessionStorage.removeItem("lasertag_active_team");
      sessionStorage.setItem("lasertag_selected_mode", "solo");
      sessionStorage.setItem(
        "lasertag_onboarding_solo",
        JSON.stringify({
          role: "SOLO",
          confirmedAt: new Date().toISOString(),
        })
      );

      await refetch();
      router.push("/slot-booking");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Conversion failed";
      setError(msg);
      setIsConverting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
      {/* Team Code Display */}
      <div className="border-2 border-dashed border-[#00F0FF] p-3 rounded-lg text-center w-full bg-[#00F0FF]/5">
        <p className="font-pixel text-[10px] text-white/70 tracking-widest uppercase">
          SQUAD JOIN CODE
        </p>
        <p
          onClick={handleCopy}
          title="Click to copy squad code"
          className="font-pixel text-xl text-[#00F0FF] tracking-widest font-bold my-1 cursor-pointer hover:text-white transition-colors select-all"
        >
          {teamCode || "------"}
        </p>
        <p className="font-pixel text-[9px] text-[#00F0FF]/80">
          {copied ? "✓ COPIED TO CLIPBOARD!" : `Click to copy code • ${memberCount}/5 operatives`}
        </p>
      </div>

      {/* Roster & Slot Booking Action Section */}
      {memberCount >= 2 ? (
        <div className="w-full flex flex-col items-center gap-2 mt-1">
          {isLeader ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/slot-booking")}
                className="w-full font-pixel text-xs py-3 px-4 bg-[#FEDC02] text-black font-bold border-2 border-white hover:bg-[#ffe733] rounded-lg uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer shadow-[0_3px_0_#9c8400]"
              >
                PROCEED TO BOOK ARENA SLOT →
              </button>
              <p className="font-mono text-[10px] text-white/60 text-center">
                Squad ready! ({memberCount}/5 operatives). You can book now or invite more teammates.
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled
                className="w-full font-pixel text-[11px] py-3 px-4 bg-[#1b1b26] text-gray-400 border-2 border-gray-600 rounded-lg uppercase tracking-wider cursor-not-allowed opacity-75"
              >
                WAITING FOR LEADER TO BOOK SLOT
              </button>
              <p className="font-mono text-[10px] text-white/60 text-center">
                Only your squad leader can confirm your arena match time slot.
              </p>
            </>
          )}
        </div>
      ) : (
        /* Team has only 1 member (Leader alone) */
        <div className="w-full flex flex-col items-center gap-2 mt-1">
          {isLeader && (
            <>
              <button
                type="button"
                disabled
                className="w-full font-pixel text-[10px] py-2.5 px-3 bg-[#241710] text-amber-300 border-2 border-amber-700/80 rounded-lg uppercase tracking-wider cursor-not-allowed opacity-80"
              >
                NEED AT LEAST 2 MEMBERS TO BOOK SQUAD
              </button>
              <p className="font-mono text-[10px] text-amber-200/70 text-center">
                Share your Squad Code with friends. At least 1 friend must join before booking a squad slot.
              </p>

              {/* Option to Convert to Solo */}
              <div className="flex flex-col items-center gap-1 mt-2 w-full">
                {error && (
                  <p className="font-pixel text-[9px] text-[#FF0055]">{error}</p>
                )}
                <button
                  type="button"
                  onClick={handleConvertToSolo}
                  disabled={isConverting}
                  className={`w-full font-pixel text-[10px] py-2 px-3 rounded transition-colors uppercase border ${
                    confirmStep
                      ? "bg-[#FF0055] text-white border-[#FF0055] animate-pulse"
                      : "bg-transparent text-white/60 border-white/20 hover:text-[#00F0FF] hover:border-[#00F0FF]"
                  }`}
                >
                  {isConverting
                    ? "SWITCHING..."
                    : confirmStep
                    ? "CONFIRM SWITCH TO SOLO?"
                    : "PLAY AS SOLO INSTEAD"}
                </button>
                {confirmStep && (
                  <button
                    type="button"
                    onClick={() => setConfirmStep(false)}
                    className="font-pixel text-[9px] text-white/40 hover:text-white underline cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TeamCodeSection;
