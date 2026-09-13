"use client";

import { useState } from "react";
import { ModePopup, type PopupMode } from "@/components/mode-popup/ModePopup";
import { ArcadeButton } from "@/components/mode-popup/ArcadeButton";

/**
 * /register — "Select Your Mode" page.
 *
 * The background, heading, and decorative elements behind the buttons
 * are being designed separately — this page intentionally only renders
 * the three mode-selection buttons and the modal overlay.
 *
 * INTEGRATION NOTES FOR WHOEVER BUILDS THE BACKGROUND PAGE:
 * ─────────────────────────────────────────────────────────
 * 1. The three mode buttons are rendered by <ModeButtonRow />.
 *    To place them at a specific position in your layout, just import
 *    and drop <ModeButtonRow onSelect={...} /> anywhere.
 *
 * 2. The modal is <ModePopup isOpen={open} mode={selectedMode} onClose={...} />.
 *    It renders as a fixed overlay (z-index: 50) so it sits on top of
 *    whatever the background page looks like.
 *
 * 3. State lives here in RegisterPage. When integrating with a different
 *    layout, lift `open` and `selectedMode` state to the parent as needed.
 *
 * 4. Route: /register (app/register/page.tsx)
 */

interface ModeOption {
  mode: PopupMode;
  label: string;
}

const modes: ModeOption[] = [
  { mode: "solo", label: "SOLO" },
  { mode: "create_team", label: "CREATE TEAM" },
  { mode: "join_team", label: "JOIN TEAM" },
];

export default function RegisterPage() {
  const [open, setOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<PopupMode>("solo");

  function openModal(mode: PopupMode) {
    setSelectedMode(mode);
    setOpen(true);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#08080d] px-6 py-12">
      {/*
        ── BACKGROUND PAGE INTEGRATION POINT ──
        Replace the bg-[#08080d] above and add your background
        elements (hero art, starfield, mode-selection cards, etc.) here.
        The buttons and modal will sit on top.
      */}

      {/* Mode selection buttons */}
      <div className="flex flex-wrap gap-6 justify-center">
        {modes.map(({ mode, label }) => (
          <ArcadeButton
            key={mode}
            label={label}
            type="button"
            onClick={() => openModal(mode)}
          />
        ))}
      </div>

      {/* Modal — fixed overlay, always on top */}
      <ModePopup
        isOpen={open}
        mode={selectedMode}
        onClose={() => setOpen(false)}
      />
    </main>
  );
}
