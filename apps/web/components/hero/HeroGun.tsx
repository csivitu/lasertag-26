"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";

const HITBOX =
  "polygon(98.8% 84.8%, 98.3% 98.6%, 76.8% 80.1%, 54.8% 48.1%, 62.2% 39.1%, 91.0% 31.7%)";
const LASER_MS = 1600;

export function HeroGun() {
  const [firing, setFiring] = useState(false);
  const fireTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleFire() {
    if (firing) return;
    setFiring(true);
    fireTimeout.current = setTimeout(() => setFiring(false), LASER_MS);
  }

  useEffect(() => {
    return () => {
      if (fireTimeout.current) clearTimeout(fireTimeout.current);
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute bottom-[2vw] left-[-6vw] aspect-[4096/3650] w-[min(165vw,820px)] [--gun-rot:0deg] [transform:scaleX(-1)_rotate(var(--gun-rot))] lg:bottom-[4vh] lg:left-[6vw] lg:h-[min(145vh,1400px,73vw)] lg:w-auto lg:[--gun-rot:22.52deg]"
    >
      <Image
        src="/hero/gun-only.png"
        alt=""
        fill
        sizes="(min-width: 1024px) 60vw, 165vw"
        loading="eager"
        fetchPriority="high"
        quality={90}
        className="object-contain"
      />
      <Image
        src="/hero/gun-beam.png"
        alt=""
        aria-hidden
        fill
        sizes="(min-width: 1024px) 60vw, 165vw"
        loading="eager"
        fetchPriority="high"
        quality={90}
        className={`hero-beam pointer-events-none object-contain ${firing ? "is-firing" : ""}`}
        style={{ "--laser-duration": `${LASER_MS}ms` } as CSSProperties}
      />
      <button
        type="button"
        onClick={handleFire}
        aria-label="Fire laser gun"
        className="pointer-events-auto absolute inset-0 cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-accent"
        style={{ clipPath: HITBOX }}
      />
    </div>
  );
}
