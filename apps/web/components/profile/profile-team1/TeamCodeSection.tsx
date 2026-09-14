"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, apiBaseUrl } from "@/lib/auth-client";
import { useUserProfile } from "@/hooks/useUserProfile";

export function TeamCodeSection() {
  const router = useRouter();
  const { data: session } = useSession();
  const { profile } = useUserProfile();
  const [teamCode, setTeamCode] = useState<string>("");
  const [memberCount, setMemberCount] = useState<number>(1);
  const [isConverting, setIsConverting] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.team) {
      setTeamCode(profile.team.teamCode);
      setMemberCount(profile.team.memberCount);
      return;
    }

    try {
      const activeTeamStr =
        sessionStorage.getItem("lasertag_active_team") ||
        localStorage.getItem("lasertag_active_team");
      if (activeTeamStr) {
        const parsed = JSON.parse(activeTeamStr);
        setTeamCode(parsed.teamCode || "");
        setMemberCount(parsed.memberCount || 1);
      }
    } catch {
      // ignore
    }
  }, [profile]);

  const handleCopy = () => {
    if (!teamCode) return;
    navigator.clipboard.writeText(teamCode);
  };

  const handleConvertToSolo = async () => {
    if (!confirmStep) {
      setConfirmStep(true);
      return;
    }

    if (!teamCode) return;

    setIsConverting(true);
    setError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/teams/convert-to-solo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ team_code: teamCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to convert team to solo.");
      }

      // Clear local team cache and mark solo mode
      sessionStorage.removeItem("lasertag_active_team");
      localStorage.removeItem("lasertag_active_team");
      localStorage.setItem("lasertag_selected_mode", "solo");
      sessionStorage.setItem("lasertag_selected_mode", "solo");
      sessionStorage.setItem(
        "lasertag_onboarding_solo",
        JSON.stringify({
          fullName: session?.user?.name || profile?.name,
          email: session?.user?.email || profile?.email,
          type: "individual",
        })
      );

      // Navigate to profile and refresh
      router.push("/profile");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Conversion error";
      setError(msg);
      setIsConverting(false);
      setConfirmStep(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full py-3 sm:py-5 px-2 select-none">
      {/* Header: TEAM CODE */}
      <div className="flex flex-col items-center gap-2 sm:gap-3 text-center w-full">
        <div className="relative w-32 sm:w-40 aspect-[210/21]">
          <Image
            src="/profile/profile-team1/TEAM CODE.svg"
            alt="TEAM CODE"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Dynamic Code Display */}
        <div className="font-pixel text-base sm:text-xl md:text-2xl text-[#FEDC02] tracking-[0.2em] border-2 border-[#FEDC02] px-3 sm:px-4 py-1 sm:py-1.5 bg-[#161622] rounded shadow-inner max-w-full truncate select-text">
          {teamCode || "PENDING"}
        </div>
      </div>

      {/* Center: Instruction Text */}
      <div className="text-center px-1 my-2">
        <p className="font-pixel text-[10px] sm:text-xs text-white/80 leading-relaxed max-w-[200px]">
          SHARE THIS CODE WITH YOUR TEAMMATES TO ASSEMBLE SQUAD
        </p>
        <p className="font-pixel text-[9px] sm:text-[10px] text-[#00F0FF] mt-1">
          MAX SQUAD: 5 OPERATIVES
        </p>
        {error && (
          <p className="font-pixel text-[9px] text-[#ff4444] mt-1.5 max-w-[180px] break-words">
            {error}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 w-full max-w-[170px] items-center">
        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-2 sm:py-2.5 px-3 bg-[#FEDC02] hover:bg-[#ffe733] text-black font-pixel text-[10px] sm:text-xs font-bold rounded border-2 border-white shadow-[0_3px_0_#9c8400] transition-all hover:scale-102 active:translate-y-[1px] uppercase tracking-wider text-center cursor-pointer"
        >
          COPY CODE
        </button>

        {/* Solo fallback button if only 1 member (leader) in team */}
        {memberCount === 1 && (
          <button
            type="button"
            disabled={isConverting}
            onClick={handleConvertToSolo}
            className={`w-full py-1.5 sm:py-2 px-2 font-pixel text-[8px] sm:text-[9px] font-bold rounded border transition-all text-center cursor-pointer uppercase tracking-wider ${
              confirmStep
                ? "bg-[#E5349E] text-white border-white animate-pulse"
                : "bg-transparent text-white/70 border-white/30 hover:border-white/80 hover:text-white"
            }`}
          >
            {isConverting
              ? "CONVERTING..."
              : confirmStep
              ? "CONFIRM CONVERT TO SOLO"
              : "PLAY SOLO INSTEAD"}
          </button>
        )}
      </div>
    </div>
  );
}
