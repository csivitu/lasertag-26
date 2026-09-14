"use client";

export const SOUNDS = {
  navHover: "/sounds/nav-hover.wav",
  navSelect: "/sounds/nav-select.wav",
  buttonClick: "/sounds/button-click.wav",
  ralphJump: "/sounds/ralph-jump-arcade.wav",
  ralphJumpClassic: "/sounds/ralph-jump-classic.wav",
  ralphJumpMid: "/sounds/ralph-jump-mid.wav",
  ralphJumpBounce: "/sounds/ralph-jump-bounce.wav",
  ralphJumpHeavy: "/sounds/ralph-jump-heavy.wav",
  ralphJumpHop: "/sounds/ralph-jump-hop.wav",
  ralphJumpStepped: "/sounds/ralph-jump-stepped.wav",
  ralphJumpBoing: "/sounds/ralph-jump-boing.wav",
  invaderShoot: "/sounds/invader-shoot.wav",
  invaderBlast: "/sounds/invader-blast.wav",
  playerHit: "/sounds/player-hit.wav",
  waveCleared: "/sounds/wave-cleared.wav",
  gameOver: "/sounds/game-over.wav",
} as const;

export type SoundKey = keyof typeof SOUNDS;

const audioPool: Partial<Record<SoundKey, HTMLAudioElement[]>> = {};
const POOL_SIZE = 6;

export function playSound(key: SoundKey, volume = 0.4) {
  if (typeof window === "undefined") return;
  try {
    const src = SOUNDS[key];
    if (!audioPool[key]) {
      audioPool[key] = Array.from({ length: POOL_SIZE }, () => {
        const audio = new Audio(src);
        audio.preload = "auto";
        return audio;
      });
    }

    const pool = audioPool[key]!;
    const audio = pool.find((a) => a.paused || a.ended) || pool[0];
    if (audio) {
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  } catch {}
}

export function preloadSounds() {
  if (typeof window === "undefined") return;
  (Object.keys(SOUNDS) as SoundKey[]).forEach((key) => {
    if (!audioPool[key]) {
      audioPool[key] = Array.from({ length: POOL_SIZE }, () => {
        const audio = new Audio(SOUNDS[key]);
        audio.preload = "auto";
        return audio;
      });
    }
  });
}

// Auto-unlock and prime the audio system on the very first interaction anywhere on the page
if (typeof window !== "undefined") {
  const unlock = () => {
    preloadSounds();
    try {
      Object.values(audioPool).forEach((pool) => {
        pool?.forEach((audio) => {
          audio.load();
        });
      });
    } catch {}
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
    window.removeEventListener("touchstart", unlock, true);
  };

  window.addEventListener("pointerdown", unlock, { once: true, capture: true });
  window.addEventListener("keydown", unlock, { once: true, capture: true });
  window.addEventListener("touchstart", unlock, { once: true, capture: true });
}

