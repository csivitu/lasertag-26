"use client";

import { useEffect } from "react";

export function GsapSectionScroller() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 1024) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let isCleanedUp = false;
    let observerInstance: { kill: () => void } | null = null;
    let onResize: (() => void) | null = null;
    let clearPending: (() => void) | null = null;

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
      let sectionTops: number[] = [];

      const cacheTops = () => {
        // Cache offsets once (resize only) — avoids getBoundingClientRect
        // forced sync layout on every wheel tick.
        sectionTops = sections.map((sec) => sec.offsetTop);
      };
      cacheTops();

      const getCurrentIndex = () => {
        const scrollY = window.scrollY;
        let closest = 0;
        let minDist = Infinity;
        for (let idx = 0; idx < sectionTops.length; idx++) {
          const dist = Math.abs(sectionTops[idx] - scrollY);
          if (dist < minDist) {
            minDist = dist;
            closest = idx;
          }
        }
        return closest;
      };

      // One swipe = one section: slow glide + cooldown that swallows
      // leftover trackpad momentum so it can't chain-jump sections.
      const GLIDE_SECONDS = 0.9;
      const MOMENTUM_COOLDOWN_MS = 600;

      const goToSection = (index: number) => {
        if (index < 0 || index >= sections.length || isAnimating) return;
        isAnimating = true;

        gsap.to(window, {
          scrollTo: { y: sections[index], autoKill: false },
          duration: GLIDE_SECONDS,
          ease: "power3.inOut",
          overwrite: true,
          onComplete: () => {
            // Hold the lock past arrival — momentum events are still
            // arriving; release only once the trackpad goes quiet.
            window.setTimeout(() => {
              isAnimating = false;
            }, MOMENTUM_COOLDOWN_MS);
          },
          // Safety: never leave the lock stuck if tween is interrupted.
          onInterrupt: () => {
            isAnimating = false;
          },
        });
        // Extra safety: release lock even if callbacks misfire. Must exceed
        // glide + cooldown or it would cut the lock mid-flight.
        window.setTimeout(() => {
          isAnimating = false;
        }, GLIDE_SECONDS * 1000 + MOMENTUM_COOLDOWN_MS + 400);
      };

      const onResizeHandler = () => cacheTops();
      onResize = onResizeHandler;
      window.addEventListener("resize", onResizeHandler, { passive: true });

      // Notched wheels fire ~100 deltaY per click — accumulate ticks and
      // only jump once ~2 notches worth of intent builds up. Trackpads
      // cross the threshold inside one deliberate swipe; stray brushes
      // and momentum tails never add up to a surprise jump.
      const WHEEL_THRESHOLD = 200;
      const TICK_DEAD_ZONE = 4;
      const ACCUMULATOR_DECAY_MS = 250;
      let pendingDelta = 0;
      let decayTimer: number | null = null;

      const resetAccumulator = () => {
        pendingDelta = 0;
        if (decayTimer !== null) {
          window.clearTimeout(decayTimer);
          decayTimer = null;
        }
      };
      clearPending = resetAccumulator;

      const handleWheel = (deltaY: number) => {
        if (isAnimating) return;
        if (typeof deltaY !== "number" || Math.abs(deltaY) < TICK_DEAD_ZONE) return;

        // Direction reversal starts fresh instead of fighting the old sum.
        if (pendingDelta !== 0 && Math.sign(deltaY) !== Math.sign(pendingDelta)) {
          pendingDelta = 0;
        }
        pendingDelta += deltaY;

        if (decayTimer !== null) window.clearTimeout(decayTimer);
        decayTimer = window.setTimeout(() => {
          pendingDelta = 0;
          decayTimer = null;
        }, ACCUMULATOR_DECAY_MS);

        if (Math.abs(pendingDelta) >= WHEEL_THRESHOLD) {
          const direction = pendingDelta > 0 ? 1 : -1;
          resetAccumulator();
          const current = getCurrentIndex();
          goToSection(current + direction);
        }
      };

      observerInstance = Observer.create({
        type: "wheel",
        preventDefault: true,
        onChange: (self) => {
          handleWheel((self as { deltaY?: number } | null)?.deltaY ?? 0);
        },
      });
    });

    return () => {
      isCleanedUp = true;
      if (onResize) window.removeEventListener("resize", onResize);
      if (clearPending) clearPending();
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
