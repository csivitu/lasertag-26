"use client";

// DEPRECATED: team/select-mode flow disabled — sign-in goes straight to slot booking (solo-only). Kept for restore.

import { useState, useEffect } from "react";
import { ModePopup, type PopupMode } from "../mode-popup/ModePopup";
import { SelectModeDesktop } from "./SelectModeDesktop";
import { SelectModeMobile } from "./SelectModeMobile";
import { AuthModal } from "../auth/AuthModal";
import { useSession } from "@/lib/auth-client";

export function SelectMode() {
  const { data: session } = useSession();
  const [selectedMode, setSelectedMode] = useState<PopupMode>("solo");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<PopupMode | null>(null);
  const [currentModeNote, setCurrentModeNote] = useState<string | null>(null);

  useEffect(() => {
    try {
      const teamStr =
        localStorage.getItem("lasertag_active_team") ||
        sessionStorage.getItem("lasertag_active_team");
      if (teamStr) {
        const parsedTeam = JSON.parse(teamStr);
        if (parsedTeam?.teamCode) {
          setCurrentModeNote(`CURRENT: TEAM ${parsedTeam.teamCode}`);
          return;
        }
      }
      const mode =
        localStorage.getItem("lasertag_selected_mode") ||
        sessionStorage.getItem("lasertag_selected_mode");
      const soloStr =
        localStorage.getItem("lasertag_onboarding_solo") ||
        sessionStorage.getItem("lasertag_onboarding_solo");
      if (mode === "solo" || soloStr) {
        setCurrentModeNote("CURRENT: SOLO");
        return;
      }
    } catch {
      // ignore
    }
    setCurrentModeNote(null);
  }, [isPopupOpen]);

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

  return (
    <>
      <SelectModeMobile onSelect={openModePopup} currentModeNote={currentModeNote} />
      <SelectModeDesktop onSelect={openModePopup} currentModeNote={currentModeNote} />

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
      />
    </>
  );
}
