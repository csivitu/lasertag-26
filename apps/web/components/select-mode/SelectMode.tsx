"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ModePopup, type PopupMode } from "../mode-popup/ModePopup";
import { SelectModeDesktop } from "./SelectModeDesktop";
import { SelectModeMobile } from "./SelectModeMobile";
import { ActiveModeDetails } from "./ActiveModeDetails";
import { AuthModal } from "../auth/AuthModal";
import { useSession, apiBaseUrl } from "@/lib/auth-client";

export function SelectMode() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedMode, setSelectedMode] = useState<PopupMode>("solo");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<PopupMode | null>(null);

  // Active mode & team state
  const [activeMode, setActiveMode] = useState<"solo" | "team" | null>(null);
  const [activeTeam, setActiveTeam] = useState<{
    teamCode?: string;
    teamName?: string;
    isLeader?: boolean;
    memberCount?: number;
    members?: Array<{ id: string; name: string; email: string; isLeader?: boolean }>;
  } | null>(null);
  const [slotInfo, setSlotInfo] = useState<{ dateStr?: string; timeStr?: string } | null>(null);
  const [isChangingMode, setIsChangingMode] = useState(false);

  const refreshActiveStatus = useCallback(() => {
    try {
      const mode = sessionStorage.getItem("lasertag_selected_mode");
      const teamStr = sessionStorage.getItem("lasertag_active_team");
      const soloStr = sessionStorage.getItem("lasertag_onboarding_solo");
      const slotStr = sessionStorage.getItem("lasertag_confirmed_slot");

      if (slotStr) {
        try {
          const parsedSlot = JSON.parse(slotStr);
          if (parsedSlot?.day && parsedSlot?.time) {
            setSlotInfo({
              dateStr: `${parsedSlot.day}th Sep 2026`,
              timeStr: parsedSlot.time,
            });
          }
        } catch {
          // ignore
        }
      }

      if (teamStr) {
        const teamObj = JSON.parse(teamStr);
        if (teamObj.teamCode) {
          setActiveMode("team");
          setActiveTeam(teamObj);
          return;
        }
      }

      if (mode === "solo" || soloStr) {
        setActiveMode("solo");
        setActiveTeam(null);
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
            setActiveMode("team");
            setActiveTeam({
              teamCode: data.data.team.teamCode,
              teamName: data.data.team.name,
              isLeader: data.data.team.isLeader,
              memberCount: data.data.team.memberCount,
              members: data.data.team.members,
            });
          } else if (data?.data?.activeRegistration) {
            setActiveMode(data.data.activeRegistration.type === "team" ? "team" : "solo");
          }
          if (data?.data?.activeRegistration?.slot) {
            const rawDate = String(data.data.activeRegistration.slot.slotDate || "");
            const match = rawDate.match(/\b(18|19|20)\b/);
            const dayNum = match ? match[1] : "18";
            setSlotInfo({
              dateStr: `${dayNum}th Sep 2026`,
              timeStr: data.data.activeRegistration.slot.slotTime,
            });
          }
        })
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    refreshActiveStatus();
  }, [refreshActiveStatus]);

  function openModePopup(mode: PopupMode) {
    if (!session?.user) {
      setPendingMode(mode);
      setIsAuthOpen(true);
      return;
    }

    setSelectedMode(mode);
    setIsPopupOpen(true);
  }

  function handleAuthSuccess() {
    if (pendingMode) {
      setSelectedMode(pendingMode);
      setPendingMode(null);
      setIsPopupOpen(true);
    }
  }

  function handleModePopupSuccess() {
    setIsPopupOpen(false);
    setIsChangingMode(false);
    refreshActiveStatus();
    if (selectedMode === "solo") {
      router.push("/slot-booking");
    } else {
      router.push("/profile");
    }
  }

  // If user has an active mode and is NOT deliberately changing it, show Active Combat Details
  if (activeMode && !isChangingMode) {
    return (
      <ActiveModeDetails
        mode={activeMode}
        teamInfo={activeTeam}
        slotInfo={slotInfo}
        userInfo={{
          name: session?.user?.name,
          email: session?.user?.email,
        }}
        onChangeMode={() => {
          setIsChangingMode(true);
        }}
      />
    );
  }

  return (
    <>
      <SelectModeMobile onSelect={openModePopup} />
      <SelectModeDesktop onSelect={openModePopup} />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingMode(null);
        }}
        onSuccess={handleAuthSuccess}
      />

      <ModePopup
        isOpen={isPopupOpen}
        mode={selectedMode}
        onClose={() => setIsPopupOpen(false)}
        onSuccess={handleModePopupSuccess}
      />
    </>
  );
}
