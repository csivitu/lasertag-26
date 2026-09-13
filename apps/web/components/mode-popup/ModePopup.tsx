"use client";

/**
 * ModePopup — public API for the "Select Your Mode" registration modal.
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   const [mode, setMode] = useState<PopupMode>("solo");
 *   ...
 *   <ModePopup isOpen={open} mode={mode} onClose={() => setOpen(false)} />
 *
 * The component renders the correct Desktop or Mobile shell based on viewport
 * via Tailwind's `hidden`/`block` pattern (same technique as Hero).
 * Both shells share the three form components — no logic is duplicated.
 */

import { ModePopupDesktop } from "./ModePopupDesktop";
import { ModePopupMobile } from "./ModePopupMobile";
import type { PopupMode } from "./modePopupDecor";

export type { PopupMode };

interface ModePopupProps {
  isOpen: boolean;
  mode: PopupMode;
  onClose: () => void;
}

export function ModePopup({ isOpen, mode, onClose }: ModePopupProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Desktop: lg and above */}
      <div className="hidden lg:block">
        <ModePopupDesktop mode={mode} onClose={onClose} />
      </div>
      {/* Mobile: below lg */}
      <div className="block lg:hidden">
        <ModePopupMobile mode={mode} onClose={onClose} />
      </div>
    </>
  );
}
