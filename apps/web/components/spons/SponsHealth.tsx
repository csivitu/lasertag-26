"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const MAX_HEALTH = 5;

export function SponsHealth() {
  const [health, setHealth] = useState(1);
  const increasing = useRef(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // Skip ticks while the tab is hidden or the widget is off-screen —
    // value + direction preserved, animation resumes where it left off.
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (!visibleRef.current) return;
      setHealth((current) => {
        if (current === MAX_HEALTH) {
          increasing.current = false;
          return current - 1;
        }

        if (current === 1) {
          increasing.current = true;
          return current + 1;
        }

        return increasing.current ? current + 1 : current - 1;
      });
    }, 700);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={wrapRef} className="flex select-none items-center">
      <div className="relative size-[clamp(28px,4.1vw,59px)] shrink-0">
        <Image
          src="/spons/heart.svg"
          alt=""
          fill
          sizes="(min-width: 1024px) 4.1vw, 4.1vw"
          draggable={false}
          className="object-contain select-none"
        />
      </div>

      <div className="ml-[clamp(4px,0.55vw,8px)] flex items-center">
        {Array.from({ length: MAX_HEALTH }).map((_, index) => (
          <Image
            key={index}
            src={
              index < health
                ? "/spons/health-filled.svg"
                : "/spons/health-empty.svg"
            }
            alt=""
            width={44}
            height={32}
            draggable={false}
            className={`h-auto w-[clamp(20px,3.02vw,44px)] shrink-0 select-none ${
              index > 0 ? "-ml-[0.42vw]" : ""
            }`}
          />
        ))}
      </div>
    </div>
  );
}