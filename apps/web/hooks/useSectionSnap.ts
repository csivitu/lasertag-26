"use client";

import { useEffect } from "react";

const SCROLL_THRESHOLD = 110; // Deliberate wheel effort needed before switching
const COOLDOWN_MS = 850;     // Lock duration while the smooth transition slides

export function useSectionSnap() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let isLocked = false;
    let accumulatedDelta = 0;
    let resetTimer: ReturnType<typeof setTimeout> | null = null;

    const handleWheel = (e: WheelEvent) => {
      // Only desktop (>= 1024px) and normal motion
      if (window.innerWidth < 1024) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("[data-snap-section]")
      );
      if (sections.length === 0) return;

      if (isLocked) {
        e.preventDefault();
        return;
      }

      accumulatedDelta += e.deltaY;

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        accumulatedDelta = 0;
      }, 200);

      // Require deliberate scroll intent
      if (Math.abs(accumulatedDelta) < SCROLL_THRESHOLD) {
        return;
      }

      e.preventDefault();
      const direction = accumulatedDelta > 0 ? 1 : -1;
      accumulatedDelta = 0;

      const scrollY = window.scrollY;

      // Find current active section
      let currentIndex = 0;
      let minDistance = Infinity;

      sections.forEach((sec, idx) => {
        const top = sec.getBoundingClientRect().top + scrollY;
        const dist = Math.abs(top - scrollY);
        if (dist < minDistance) {
          minDistance = dist;
          currentIndex = idx;
        }
      });

      const nextIndex = Math.max(
        0,
        Math.min(sections.length - 1, currentIndex + direction)
      );

      if (nextIndex === currentIndex) return;

      isLocked = true;
      const targetSec = sections[nextIndex];
      targetSec.scrollIntoView({ behavior: "smooth" });

      setTimeout(() => {
        isLocked = false;
      }, COOLDOWN_MS);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, []);
}
