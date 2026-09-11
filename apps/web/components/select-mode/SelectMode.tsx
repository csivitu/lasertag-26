"use client";

import { useState } from "react";
import { ModePopup, type PopupMode } from "../mode-popup/ModePopup";
import { SelectModeDesktop } from "./SelectModeDesktop";
import { SelectModeMobile } from "./SelectModeMobile";

export function SelectMode() {
  const [selectedMode, setSelectedMode] = useState<PopupMode>("solo");
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  function openModePopup(mode: PopupMode) {
    setSelectedMode(mode);
    setIsPopupOpen(true);
  }

  return (
    <>
      <SelectModeMobile onSelect={openModePopup} />
      <SelectModeDesktop onSelect={openModePopup} />
      <ModePopup
        isOpen={isPopupOpen}
        mode={selectedMode}
        onClose={() => setIsPopupOpen(false)}
      />
    </>
  );
}
