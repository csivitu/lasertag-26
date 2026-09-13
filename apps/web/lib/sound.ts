"use client";

export const SOUNDS = {
  navHover: "/sounds/nav-hover.wav",
  navSelect: "/sounds/nav-select.wav",
  buttonClick: "/sounds/button-click.wav",
} as const;

export type SoundKey = keyof typeof SOUNDS;

const audioPool: Partial<Record<SoundKey, HTMLAudioElement[]>> = {};
const POOL_SIZE = 4;

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
