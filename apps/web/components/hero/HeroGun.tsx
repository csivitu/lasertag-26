"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";

const HITBOX =
  "polygon(98.8% 84.8%, 98.3% 98.6%, 76.8% 80.1%, 54.8% 48.1%, 62.2% 39.1%, 91.0% 31.7%)";
const LASER_MS = 1250;

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
const REDUCED_MOTION_MEDIA_QUERY = "(prefers-reduced-motion: reduce)";
const GUN_RESTING_ROTATION_DEG = 22.52;
const GUN_SCROLLED_ROTATION_DEG = -6.0;
const GUN_SCROLL_TRANSLATE_X_VW = -4.0;
const SCROLL_DISTANCE_FACTOR = 0.8;

export function HeroGun() {
  const [firing, setFiring] = useState(false);
  const fireTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gunRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/hero/laser-shoot.wav");
    audio.preload = "auto";
    audio.volume = 0.84;
    audioRef.current = audio;
    return () => {
      audioRef.current = null;
    };
  }, []);

  function handleFire() {
    if (firing) return;
    setFiring(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    fireTimeout.current = setTimeout(() => setFiring(false), LASER_MS);
  }

  useEffect(() => {
    return () => {
      if (fireTimeout.current) clearTimeout(fireTimeout.current);
    };
  }, []);

  useEffect(() => {
    let rafId: number | null = null;

    function updateTransform() {
      if (!gunRef.current) return;

      const isDesktop = window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
      const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches;

      if (!isDesktop || prefersReducedMotion) {
        gunRef.current.style.removeProperty("--gun-rot");
        gunRef.current.style.removeProperty("--gun-tx");
        return;
      }

      const scrollY = window.scrollY;
      const scrollRange = window.innerHeight * SCROLL_DISTANCE_FACTOR;
      const progress = Math.min(Math.max(scrollY / scrollRange, 0), 1);

      const currentRotation =
        GUN_RESTING_ROTATION_DEG -
        progress * (GUN_RESTING_ROTATION_DEG - GUN_SCROLLED_ROTATION_DEG);
      const currentTx = progress * GUN_SCROLL_TRANSLATE_X_VW;

      gunRef.current.style.setProperty("--gun-rot", `${currentRotation.toFixed(2)}deg`);
      gunRef.current.style.setProperty("--gun-tx", `${currentTx.toFixed(2)}vw`);
    }

    function onScroll() {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateTransform();
      });
    }

    function onResize() {
      updateTransform();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    updateTransform();

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={gunRef}
      className="pointer-events-none absolute bottom-[2vw] left-[clamp(-110px,-16vw,-56px)] aspect-[4096/3650] w-[clamp(650px,50vw+460px,960px)] [--gun-rot:8deg] [--gun-tx:0vw] [transform:translateX(var(--gun-tx,0vw))_scaleX(-1)_rotate(var(--gun-rot))] lg:bottom-[1vh] lg:left-[-6vw] lg:h-[min(145vh,1400px,73vw)] lg:w-auto lg:[--gun-rot:22.52deg]"
    >
      <Image
        src="/hero/gun-only.webp"
        alt=""
        fill
        sizes="(min-width: 1024px) 60vw, 650px"
        loading="eager"
        fetchPriority="high"
        quality={75}
        draggable={false}
        className="object-contain select-none"
      />
      <Image
        src="/hero/gun-beam.webp"
        alt=""
        aria-hidden
        fill
        sizes="(min-width: 1024px) 60vw, 650px"
        loading="lazy"
        fetchPriority="low"
        quality={75}
        draggable={false}
        className={`hero-beam pointer-events-none object-contain select-none ${firing ? "is-firing" : ""}`}
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
