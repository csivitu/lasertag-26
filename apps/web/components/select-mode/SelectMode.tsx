"use client";

import { useState } from "react";
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
      />
    </>
  );
}
