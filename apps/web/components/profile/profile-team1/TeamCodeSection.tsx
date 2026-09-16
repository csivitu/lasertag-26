"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, apiBaseUrl } from "@/lib/auth-client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { QrCode } from "../profile-solo/QrCode";

export function TeamCodeSection() {
  const router = useRouter();
  const { data: session } = useSession();
  const { profile } = useUserProfile();
  const [teamCode, setTeamCode] = useState<string>("");
  const [memberCount, setMemberCount] = useState<number>(1);
  const [isLeader, setIsLeader] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.team) {
      setTeamCode(profile.team.teamCode);
      setMemberCount(profile.team.memberCount);
      setIsLeader(profile.team.isLeader);
      return;
    }

    try {
      const activeTeamStr =
        sessionStorage.getItem("lasertag_active_team") ||
        localStorage.getItem("lasertag_active_team");
      if (activeTeamStr) {
        const teamObj = JSON.parse(activeTeamStr);
        setTeamCode(teamObj.teamCode || "");
        setMemberCount(teamObj.memberCount || 1);
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
          }
        })
        .catch(() => {});
    }
  }, [profile, session]);

  const handleCopy = () => {
    if (teamCode) {
      navigator.clipboard.writeText(teamCode);
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
      const res = await fetch(`${apiBaseUrl}/teams/convert-to-solo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: session?.user?.id }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Failed to switch to solo");
      }

      // Clear team storage and mark solo
      localStorage.removeItem("lasertag_active_team");
      sessionStorage.removeItem("lasertag_active_team");
      localStorage.setItem("lasertag_selected_mode", "solo");
      sessionStorage.setItem("lasertag_selected_mode", "solo");
      localStorage.setItem(
        "lasertag_onboarding_solo",
        JSON.stringify({
          role: "SOLO",
          confirmedAt: new Date().toISOString(),
        })
      );
      sessionStorage.setItem(
        "lasertag_onboarding_solo",
        JSON.stringify({
          role: "SOLO",
          confirmedAt: new Date().toISOString(),
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

  const handleLeaveTeam = async () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }

    setIsLeaving(true);
    setError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/teams/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ user_id: session?.user?.id }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || "Failed to leave squad");
      }

      localStorage.removeItem("lasertag_active_team");
      sessionStorage.removeItem("lasertag_active_team");

      router.push("/select-mode");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Leave error";
      setError(msg);
      setIsLeaving(false);
      setConfirmLeave(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between h-full py-2 sm:py-3 px-2 select-none">
      {/* Header: TEAM CODE */}
      <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-center w-full">
        <div className="relative w-28 sm:w-36 aspect-[210/21]">
          <Image
            src="/profile/profile-team1/TEAM CODE.svg"
            alt="TEAM CODE"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Dynamic Code Display */}
        <div className="font-pixel text-base sm:text-xl text-[#FEDC02] tracking-[0.2em] border-2 border-[#FEDC02] px-3 py-0.5 bg-[#161622] rounded shadow-inner max-w-full truncate select-text">
          {teamCode || "PENDING"}
        </div>
      </div>

      {/* SCAN TO ENTER: QR CODE */}
      <div className="flex flex-col items-center gap-1 my-1">
        <span className="font-pixel text-[9px] sm:text-[10px] text-[#FEDC02] tracking-wider uppercase">
          SCAN TO ENTER
        </span>
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white p-1.5 rounded shadow-md border-2 border-black">
          <QrCode
            className="w-full h-full"
            value={profile?.activeRegistration?.qrToken ?? profile?.qrToken ?? null}
          />
        </div>
      </div>

      {/* Center: Instruction Text */}
      <div className="text-center px-1 my-1">
        <p className="font-pixel text-[9px] sm:text-[10px] text-white/80 leading-relaxed max-w-[200px]">
          SHARE CODE TO ASSEMBLE SQUAD
        </p>
        <p className="font-pixel text-[8px] sm:text-[9px] text-[#00F0FF]">
          MAX SQUAD: 5 OPERATIVES
        </p>
        {error && (
          <p className="font-pixel text-[9px] text-[#ff4444] mt-1 max-w-[180px] break-words">
            {error}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-1.5 w-full max-w-[170px] items-center">
        <button
          type="button"
          onClick={handleCopy}
          className="w-full py-1.5 sm:py-2 px-3 bg-[#FEDC02] hover:bg-[#ffe733] text-black font-pixel text-[9px] sm:text-[10px] font-bold rounded border-2 border-white shadow-[0_2px_0_#9c8400] transition-all hover:scale-102 active:translate-y-[1px] uppercase tracking-wider text-center cursor-pointer"
        >
          COPY CODE
        </button>

        {/* Solo fallback button if only 1 member (leader) in team */}
        {memberCount === 1 && isLeader && (
          <button
            type="button"
            disabled={isConverting}
            onClick={handleConvertToSolo}
            className={`w-full py-1 sm:py-1.5 px-2 font-pixel text-[8px] sm:text-[9px] font-bold rounded border transition-all text-center cursor-pointer uppercase tracking-wider ${
              confirmStep
                ? "bg-[#E5349E] text-white border-white animate-pulse"
                : "bg-transparent text-white/70 border-white/30 hover:border-white/80 hover:text-white"
            }`}
          >
            {isConverting
              ? "CONVERTING..."
              : confirmStep
              ? "CONFIRM CONVERT"
              : "PLAY SOLO INSTEAD"}
          </button>
        )}

        {/* Leave button for non-leaders or multi-member squads */}
        {(memberCount > 1 || !isLeader) && (
          <button
            type="button"
            disabled={isLeaving}
            onClick={handleLeaveTeam}
            className={`w-full py-1 sm:py-1.5 px-2 font-pixel text-[8px] sm:text-[9px] font-bold rounded border transition-all text-center cursor-pointer uppercase tracking-wider ${
              confirmLeave
                ? "bg-[#E5349E] text-white border-white animate-pulse"
                : "bg-transparent text-white/70 border-white/30 hover:border-white/80 hover:text-white"
            }`}
          >
            {isLeaving
              ? "LEAVING..."
              : confirmLeave
              ? "CONFIRM LEAVE"
              : "LEAVE SQUAD"}
          </button>
        )}
      </div>
    </div>
  );
}
