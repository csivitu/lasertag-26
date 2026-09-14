"use client";

import { useEffect } from "react";

export function GsapSectionScroller() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 1024) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let isCleanedUp = false;
    let observerInstance: { kill: () => void } | null = null;

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
          },
        });
      };

      observerInstance = Observer.create({
        type: "wheel",
        tolerance: 20,
        preventDefault: true,
        onDown: () => {
          if (isAnimating) return;
          const current = getCurrentIndex();
          if (current < sections.length - 1) {
            goToSection(current + 1);
          }
        },
        onUp: () => {
          if (isAnimating) return;
          const current = getCurrentIndex();
          if (current > 0) {
            goToSection(current - 1);
          }
        },
      });
    });

    return () => {
      isCleanedUp = true;
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
