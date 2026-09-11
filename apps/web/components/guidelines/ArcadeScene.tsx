'use client';

import Image from 'next/image';
import { useCallback } from 'react';
import { SpaceInvadersScreen } from './arcade/SpaceInvadersScreen';
import {
  SCREEN_HEIGHT_PERCENT,
  SCREEN_LEFT_PERCENT,
  SCREEN_TOP_PERCENT,
  SCREEN_WIDTH_PERCENT,
} from './arcade/space-invaders.constants';

/**
 * The monitor's own Figma node doesn't bound the controllers — they're
 * siblings, cable-linked but not children — so the scene's real extent is
 * the union of all three: 0,0 to 621,645.37 in monitor-local units.
 *
 * Monitor box in Figma:
 * - Left: 0, Top: 0
 * - Width: 585 (585 / 621 = 94.2029%)
 * - Height: 541 (541 / 645.37 = 83.8279%)
 */
export function ArcadeScene() {
  const handleControllerYellowClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('arcade-control', { detail: 'left' })
      );
    }
  }, []);

  const handleControllerCyanClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('arcade-control', { detail: 'right' })
      );
    }
  }, []);

  return (
    <div className="relative aspect-[621/645.37] h-[80svh] max-h-[760px] w-auto max-w-full">
      {/* Pink Arcade Monitor (585 x 541 within 621 x 645.37 scene) */}
      <div className="absolute left-0 top-0 h-[83.83%] w-[94.20%]">
        <Image
          src="/guidelines/arcade-monitor.svg"
          alt="LaserTag Arcade Computer"
          fill
          priority
          sizes="560px"
        />

        {/* Interactive Space Invaders Screen Overlay */}
        <div
          className="absolute z-10"
          style={{
            left: `${SCREEN_LEFT_PERCENT}%`,
            top: `${SCREEN_TOP_PERCENT}%`,
            width: `${SCREEN_WIDTH_PERCENT}%`,
            height: `${SCREEN_HEIGHT_PERCENT}%`,
          }}
        >
          <SpaceInvadersScreen />
        </div>
      </div>

      {/* Yellow Gamepad Controller */}
      <button
        type="button"
        onClick={handleControllerYellowClick}
        aria-label="Yellow Arcade Controller (Move Left & Fire)"
        className="absolute left-[27.65%] top-[66.94%] h-[21.71%] w-[25.15%] cursor-pointer transition-transform duration-100 active:scale-95 focus:outline-none"
      >
        <Image
          src="/guidelines/controller-yellow.svg"
          alt=""
          fill
          loading="lazy"
          sizes="150px"
        />
      </button>

      {/* Cyan Gamepad Controller */}
      <button
        type="button"
        onClick={handleControllerCyanClick}
        aria-label="Cyan Arcade Controller (Move Right & Fire)"
        className="absolute left-[49.11%] top-[82.55%] h-[17.46%] w-[21.86%] cursor-pointer transition-transform duration-100 active:scale-95 focus:outline-none"
      >
        <Image
          src="/guidelines/controller-cyan.svg"
          alt=""
          fill
          loading="lazy"
          sizes="130px"
        />
      </button>
    </div>
  );
}
