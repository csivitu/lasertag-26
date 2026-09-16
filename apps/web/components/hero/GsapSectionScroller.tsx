"use client";

import { useEffect } from "react";

export function GsapSectionScroller() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Desktop-only: section hijack must never engage on phones/tablets,
    // including after resize or device rotation — re-evaluated live.
    const desktopMq = window.matchMedia("(min-width: 1024px)");
    if (!desktopMq.matches) return;

    let isCleanedUp = false;
    let observerInstance: { kill: () => void } | null = null;
    let onMqChange: ((e: MediaQueryListEvent) => void) | null = null;

    Promise.all([
      import("gsap"),
      import("gsap/Observer"),
      import("gsap/ScrollToPlugin"),
    ]).then(([{ gsap }, { Observer }, { ScrollToPlugin }]) => {
      if (isCleanedUp) return;

      gsap.registerPlugin(Observer, ScrollToPlugin);

      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("[data-snap-section]")
      );
      if (sections.length === 0) return;

      let isAnimating = false;

      // Acceleration-based momentum filter (fullPage.js-style):
      // a real finger push ACCELERATES (each tick >= recent average);
      // a momentum tail DECELERATES. Ticks that keep up are intent,
      // falling-off ticks are the tail and get ignored — no dead
      // windows, no per-device threshold tuning.
      const AVG_WINDOW = 10;
      const RECENT_MS = 250;
      const recentDeltas: number[] = [];
      let lastDirection = 0; // 1 = down, -1 = up
      let lastPushTime = 0;
      let pendingDirection: 1 | -1 | null = null;

      const getCurrentIndex = () => {
        const scrollY = window.scrollY;
        let closest = 0;
        let minDist = Infinity;
        sections.forEach((sec, idx) => {
          const top = sec.getBoundingClientRect().top + scrollY;
          const dist = Math.abs(top - scrollY);
          if (dist < minDist) {
            minDist = dist;
            closest = idx;
          }
        });
        return closest;
      };

      const goToSection = (index: number) => {
        if (index < 0 || index >= sections.length || isAnimating) return;
        isAnimating = true;

        gsap.to(window, {
          scrollTo: { y: sections[index], autoKill: false },
          duration: 0.65,
          ease: "power2.out",
          overwrite: "auto",
          onComplete: () => {
            isAnimating = false;
            // Carry a gesture that was recorded mid-glide: a second flick
            // fired while the first glide was running fires the moment we
            // land, instead of being dropped.
            if (
              pendingDirection &&
              performance.now() - lastPushTime < RECENT_MS
            ) {
              const direction = pendingDirection;
              pendingDirection = null;
              const current = getCurrentIndex();
              const next = current + direction;
              if (next >= 0 && next < sections.length) {
                lastDirection = direction;
                goToSection(next);
                return;
              }
            }
            pendingDirection = null;
          },
          // Anchor-nav kills our tween via killTweensOf — release the lock
          // or wheel snapping bricks until reload.
          onInterrupt: () => {
            isAnimating = false;
            pendingDirection = null;
          },
        });
      };

      const tryGo = (direction: 1 | -1) => {
        const magnitude = Math.abs(normDeltaY);
        recentDeltas.push(magnitude);
        if (recentDeltas.length > AVG_WINDOW) recentDeltas.shift();
        const average =
          recentDeltas.reduce((sum, d) => sum + d, 0) / recentDeltas.length;

        const isReversal = direction !== lastDirection;
        const isAccelerating = magnitude >= average;

        if (isAnimating) {
          // Only accelerating pushes count as queued intent; the tail
          // never queues a surprise jump.
          if (isAccelerating || isReversal) {
            pendingDirection = direction;
            lastPushTime = performance.now();
          }
          return;
        }

        // A falling-off tick (tail) is ignored — unless it reverses.
        if (!isReversal && !isAccelerating) return;
        const current = getCurrentIndex();
        const next = current + direction;
        if (next < 0 || next >= sections.length) return;
        lastDirection = direction;
        lastPushTime = performance.now();
        goToSection(next);
      };

      const normDelta = (self: unknown) => {
        const obs = self as { deltaY?: number; event?: WheelEvent } | null;
        let d = obs?.deltaY ?? 0;
        const mode = obs?.event?.deltaMode ?? 0;
        // Firefox reports lines, others pixels — normalize before use.
        if (mode === 1) d *= 40;
        else if (mode === 2) d *= 800;
        return d;
      };

      let normDeltaY = 0;

      observerInstance = Observer.create({
        type: "wheel",
        tolerance: 20,
        preventDefault: true,
        onDown: (self) => {
          normDeltaY = normDelta(self);
          tryGo(1);
        },
        onUp: (self) => {
          normDeltaY = normDelta(self);
          tryGo(-1);
        },
      });
      onMqChange = (e) => {
        if (!e.matches) {
          observerInstance?.kill();
          observerInstance = null;
        }
      };
      desktopMq.addEventListener("change", onMqChange);
    });

    return () => {
      isCleanedUp = true;
      if (onMqChange) desktopMq.removeEventListener("change", onMqChange);
      if (observerInstance) {
        observerInstance.kill();
      }
      import("gsap").then(({ gsap }) => {
        gsap.killTweensOf(window);
      }).catch(() => {});
    };
  }, []);

  return null;
}
