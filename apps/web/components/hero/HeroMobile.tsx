"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Starfield } from "./Starfield";

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
      <Starfield />

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
            loading="lazy"
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

      {/* Content block: Wordmark, tagline typewriter, Register CTA (enlarged for mobile) */}
      <div className="relative z-10 flex flex-col items-center px-3 pt-3 pb-2 sm:px-6 sm:pt-6 sm:pb-3">
        <div className="relative mx-auto w-[min(96%,460px)] sm:w-[min(88%,540px)]">
          <Image
            src="/hero/title-wordmark.png"
            alt="LaserTag"
            width={2436}
            height={309}
            loading="lazy"
            unoptimized
            className="h-auto w-full"
          />
        </div>

        {/* Scalable terminal-typewriter tagline — clamps from 12px on 320px up to 26px on tablet */}
        <p
          className="tagline-crt-glitch relative mt-3 whitespace-nowrap text-center font-pixel text-[clamp(12px,3.9vw,26px)] sm:mt-4 text-[#23eff1]"
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

        {/* CTA Register button (enlarged for mobile) */}
        <div className="mt-4 flex w-full justify-center sm:mt-5">
          <a
            href="#register"
            className="group relative block w-[min(85%,350px)] sm:w-[min(60%,400px)] overflow-hidden outline-offset-4 transition-[transform,filter] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#01daec] active:translate-y-0.5 active:scale-y-[0.94] motion-reduce:transition-none"
            style={{ transformOrigin: "bottom" }}
          >
            <Image
              src="/hero/register-button.png"
              alt="Register now"
              width={1197}
              height={285}
              loading="lazy"
              unoptimized
              className="h-auto w-full opacity-100 transition-opacity duration-200 ease-out group-active:opacity-0"
            />
            <Image
              src="/hero/register-button-pressed.png"
              alt=""
              aria-hidden
              width={1197}
              height={261}
              loading="lazy"
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

      {/* Gun art: flipped horizontally (scaleX(-1)) so the gun points up-right
          and the hand enters from the bottom-left corner.
          Enlarged for dramatic mobile arcade impact.
          When fired, the beam shoots freely up-right across the starry background. */}
      <div className="pointer-events-none relative z-10 flex-1 min-h-[340px] max-h-[640px] w-full">
        <div
          className="absolute"
          style={{
            width: "min(165vw, 820px)",
            aspectRatio: GUN_ASPECT_RATIO,
            left: "clamp(-28px, -4vw, -16px)",
            bottom: "clamp(-28px, -4vw, -16px)",
            transform: "scaleX(-1)",
            transformOrigin: "center center",
          }}
        >
          <Image
            src="/hero/gun-only.png"
            alt=""
            width={4096}
            height={3650}
            sizes="165vw"
            loading="eager"
            fetchPriority="high"
            quality={90}
            className="pointer-events-none absolute inset-0 size-full object-contain"
          />

          {/* Beam + muzzle sparks overlay, revealed on fire */}
          <div aria-hidden className="pointer-events-none absolute inset-0 size-full">
            <Image
              src="/hero/gun-beam.png"
              alt=""
              width={4096}
              height={3650}
              sizes="165vw"
              loading="eager"
              fetchPriority="high"
              quality={90}
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
