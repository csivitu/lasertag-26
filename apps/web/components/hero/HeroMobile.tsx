"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { pixelDots, sparkles, twinkleStyle } from "./heroDecor";

/**
 * Mobile hero (<1024px). Feature-parity with HeroDesktop — logo/nav,
 * starfield twinkle, typewriter tagline, gun art, register CTA — laid out
 * as a single stacked column instead of a two-column scene. The Figma
 * "Hero - Mobile" frame has no nav or CTA at all; both are added here
 * deliberately for site consistency, the same departure already made on
 * desktop for the header's side gutters.
 *
 * This is the one hero variant that needs client state (the nav toggle),
 * so unlike HeroDesktop it is a client component.
 */

const GUN_ASPECT_RATIO = "4096 / 3650";
// Exact silhouette polygon covering the gun casing, trigger, and grip
const GUN_HITBOX_CLIP_PATH =
  "polygon(98.8% 84.8%, 98.3% 98.6%, 76.8% 80.1%, 54.8% 48.1%, 62.2% 39.1%, 91.0% 31.7%)";

const navLinks = [
  { label: "HOME", href: "#" },
  { label: "ABOUT", href: "#about" },
  { label: "FAQs", href: "#faqs" },
  { label: "SIGN IN", href: "#sign-in" },
];

export function HeroMobile() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [firing, setFiring] = useState(false);
  const fireTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Same fire-on-click as HeroDesktop — Register Now still navigates
  // normally, this just layers the beam reveal on top.
  function handleFire() {
    if (firing) return;
    setFiring(true);
    fireTimeout.current = setTimeout(() => setFiring(false), 1600);
  }

  useEffect(() => {
    return () => {
      if (fireTimeout.current) clearTimeout(fireTimeout.current);
    };
  }, []);

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden bg-[#08080d] lg:hidden">
      {/* Background pixel dots + sparkles wrapped in an absolute overflow-clipped container */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {pixelDots.map((d, i) => (
          <span
            key={`dot-${i}`}
            className="absolute"
            style={{
              left: `${d.l}%`,
              top: `${d.t}%`,
              width: `${d.w}vw`,
              height: `${d.h}vw`,
              backgroundColor: d.c,
              ...twinkleStyle(i),
            }}
          />
        ))}
        {sparkles.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`sparkle-${i}`}
            src={`/hero/${s.src}.svg`}
            alt=""
            className="absolute block max-w-none"
            style={{
              left: `${s.l}%`,
              top: `${s.t}%`,
              width: `${s.w}vw`,
              height: `${s.h}vw`,
              ...twinkleStyle(pixelDots.length + i),
            }}
          />
        ))}
      </div>

      {/* Header: logo left, hamburger right */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <a
          href="#"
          aria-label="LaserTag home"
          className="block h-12 w-12 shrink-0 rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#01daec]"
        >
          <Image
            src="/hero/logo-badge.png"
            alt=""
            width={240}
            height={240}
            priority
            unoptimized
            className="size-full object-contain"
          />
        </a>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[6px] rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#01daec]"
        >
          <span
            className={`h-[3px] w-7 bg-white transition-transform duration-200 ${
              menuOpen ? "translate-y-[9px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-[3px] w-7 bg-white transition-opacity duration-200 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`h-[3px] w-7 bg-white transition-transform duration-200 ${
              menuOpen ? "-translate-y-[9px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Dropdown nav panel */}
      {menuOpen && (
        <nav className="absolute left-5 right-5 top-[76px] z-30 flex flex-col overflow-hidden rounded-md border border-white/15 bg-[#0d0d14]/95 backdrop-blur-sm sm:left-8 sm:right-8 sm:top-[88px]">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="border-b border-white/10 px-5 py-4 font-pixel text-sm tracking-[1px] text-white outline-offset-[-2px] transition-colors last:border-b-0 focus-visible:outline-2 focus-visible:outline-[#01daec] active:text-[#01daec]"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}

      {/* Content block: Wordmark, tagline typewriter, Register CTA */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-6 pb-2 sm:px-6 sm:pt-8 sm:pb-4">
        <div className="relative mx-auto w-[min(90%,380px)] sm:w-[min(80%,440px)]">
          <Image
            src="/hero/title-wordmark.png"
            alt="LaserTag"
            width={2436}
            height={309}
            priority
            unoptimized
            className="h-auto w-full"
          />
        </div>

        {/* Scalable terminal-typewriter tagline — clamps from 11px on 320px up to 24px on tablet */}
        <p
          className="tagline-crt-glitch relative mt-4 whitespace-nowrap text-center font-pixel text-[clamp(11px,3.3vw,22px)] sm:mt-5 sm:text-[clamp(14px,2.4vw,24px)] text-[#23eff1]"
          style={{ lineHeight: "1.6em" }}
        >
          {"From Pixels to "}
          <span className="pew-pew-typewriter inline-block overflow-hidden whitespace-nowrap align-middle">
            Pew Pew
          </span>
          <span
            aria-hidden
            className="cursor-blink ml-[0.25em] inline-block align-middle bg-[#23eff1]"
            style={{ width: "0.55em", height: "0.85em" }}
          />
        </p>

        {/* CTA Register button */}
        <div className="mt-5 flex w-full justify-center sm:mt-6">
          <a
            href="#register"
            className="group relative block w-[min(72%,280px)] sm:w-[min(50%,320px)] overflow-hidden outline-offset-4 transition-[transform,filter] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#01daec] active:translate-y-0.5 active:scale-y-[0.94] motion-reduce:transition-none"
            style={{ transformOrigin: "bottom" }}
          >
            <Image
              src="/hero/register-button.png"
              alt="Register now"
              width={1197}
              height={285}
              priority
              unoptimized
              className="h-auto w-full opacity-100 transition-opacity duration-200 ease-out group-active:opacity-0"
            />
            <Image
              src="/hero/register-button-pressed.png"
              alt=""
              aria-hidden
              width={1197}
              height={261}
              unoptimized
              className="absolute inset-x-0 bottom-0 h-auto w-full opacity-0 transition-opacity duration-200 ease-out group-active:opacity-100"
            />
            <span
              aria-hidden
              className="button-shine pointer-events-none absolute inset-0 opacity-100 transition-opacity duration-200 ease-out group-active:opacity-0"
              style={{
                maskImage: "url(/hero/register-button-mask.png)",
                maskSize: "100% 100%",
                maskRepeat: "no-repeat",
                WebkitMaskImage: "url(/hero/register-button-mask.png)",
                WebkitMaskSize: "100% 100%",
                WebkitMaskRepeat: "no-repeat",
                background:
                  "linear-gradient(75deg, transparent, rgba(255,255,255,0.55) 50%, transparent)",
                backgroundSize: "250% 100%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "-60% 0",
              }}
            />
            <span
              aria-hidden
              className="button-shine pointer-events-none absolute inset-x-0 bottom-0 opacity-0 transition-opacity duration-200 ease-out group-active:opacity-100"
              style={{
                aspectRatio: "1197 / 261",
                maskImage: "url(/hero/register-button-pressed-mask.png)",
                maskSize: "100% 100%",
                maskRepeat: "no-repeat",
                WebkitMaskImage: "url(/hero/register-button-pressed-mask.png)",
                WebkitMaskSize: "100% 100%",
                WebkitMaskRepeat: "no-repeat",
                background:
                  "linear-gradient(75deg, transparent, rgba(255,255,255,0.55) 50%, transparent)",
                backgroundSize: "250% 100%",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "-60% 0",
              }}
            />
          </a>
        </div>
      </div>

      {/* Gun art: gun pointing up-left, hand entering from bottom-right.
          Anchored to the bottom-right corner so the flat cut on the forearm
          falls cleanly past the screen boundary, while the gun body
          remains heroic and centered in the lower scene.
          When fired, the beam shoots freely up-left across the hero background. */}
      <div className="pointer-events-none relative z-10 flex-1 min-h-[260px] max-h-[520px] w-full">
        <div
          className="absolute"
          style={{
            width: "min(126vw, 620px)",
            aspectRatio: GUN_ASPECT_RATIO,
            right: "clamp(-16px, -2.5vw, -8px)",
            bottom: "clamp(-16px, -2.5vw, -8px)",
          }}
        >
          <Image
            src="/hero/gun-only.png"
            alt=""
            width={4096}
            height={3650}
            priority
            unoptimized
            className="pointer-events-none absolute inset-0 size-full object-contain"
          />

          {/* Beam + muzzle sparks overlay, revealed on fire */}
          <div aria-hidden className="pointer-events-none absolute inset-0 size-full">
            <Image
              src="/hero/gun-beam.png"
              alt=""
              width={4096}
              height={3650}
              priority
              unoptimized
              className={`gun-fire-beam pointer-events-none size-full object-contain ${
                firing ? "is-firing" : ""
              }`}
            />
          </div>

          {/* Clickable button matching the exact gun polygon */}
          <button
            type="button"
            onClick={handleFire}
            aria-label="Fire laser gun"
            className="pointer-events-auto absolute inset-0 cursor-pointer border-0 bg-transparent p-0 outline-none focus-visible:outline-2 focus-visible:outline-[#01daec]"
            style={{
              clipPath: GUN_HITBOX_CLIP_PATH,
            }}
          />
        </div>
      </div>
    </section>
  );
}
