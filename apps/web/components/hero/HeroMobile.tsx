"use client";

import { useState } from "react";
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

const navLinks = [
  { label: "HOME", href: "#" },
  { label: "ABOUT", href: "#about" },
  { label: "FAQs", href: "#faqs" },
  { label: "SIGN IN", href: "#sign-in" },
];

export function HeroMobile() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[#08080d] lg:hidden">
      {/* Background pixel dots + sparkles, same data/twinkle as desktop. */}
      {pixelDots.map((d, i) => (
        <span
          key={`dot-${i}`}
          aria-hidden
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
          aria-hidden
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

      {/* Header: logo left, hamburger right. No hover states to adapt here —
          touch has no hover, so the desktop nav's ▶-marker-on-hover approach
          doesn't carry over; a toggleable menu is the standard mobile
          replacement instead of trying to fake hover semantics on tap. */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-5">
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

      {/* Dropdown nav panel. Overlays the content below rather than pushing
          it down, and closes itself on link tap. */}
      {menuOpen && (
        <nav className="absolute left-5 right-5 top-[76px] z-30 flex flex-col overflow-hidden rounded-md border border-white/15 bg-[#0d0d14]/95 backdrop-blur-sm">
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

      <div className="relative z-10 px-6 pb-10 pt-8">
        <div className="relative mx-auto w-[min(92%,420px)]">
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

        {/* Same terminal-typewriter tagline as desktop — only "Pew Pew"
            types out, the CRT glitch and cursor blink are shared global
            animations already sized in em/ch off this element's font-size. */}
        <p
          className="tagline-crt-glitch relative mt-5 whitespace-nowrap text-center font-pixel text-[clamp(14px,3.6vw,26px)] text-[#23eff1]"
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

        {/* CTA sits right after the tagline, above the gun art — matches the
            reference layout rather than the gun-then-button order this had
            before. */}
        <div className="mt-6 flex justify-center">
          <a
            href="#register"
            className="group relative block w-[72%] max-w-xs overflow-hidden outline-offset-4 transition-[transform,filter] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-[#01daec] active:translate-y-0.5 active:scale-y-[0.94] motion-reduce:transition-none"
            style={{ transformOrigin: "bottom" }}
          >
            {/* Same real pressed-state export as desktop (399x87 vs resting
                399x95), bottom-anchored and cross-faded on :active so the
                button's own footprint never shifts when pressed. A slower,
                eased crossfade plus the container's own active:scale-y
                squash reads as one continuous press, not a flicker. */}
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
            {/* Same arcade shine as desktop — inert on pure touch (no hover),
                free for hybrid mouse+touch devices. Two masked layers, one
                per button state, crossfading in sync with the button images.
                The gradient band is the masked element's own background,
                animated via background-position rather than transforming a
                separate child (see HeroDesktop for why — a transformed
                child inside a masked parent left a white notch artifact at
                one corner). */}
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

      {/* Gun art is a plain horizontal mirror of the source asset — no
          rotation, since rotating a pixel-art PNG by an arbitrary CSS angle
          forces the browser to interpolate it, blurring the crisp pixel
          edges. The source art itself ends in flat, un-tapered cuts at both
          the beam's far tip and the wrist/forearm — visible as an "edge"
          whenever that raw cut lands inside the visible frame. So this is
          scaled up and shifted until BOTH of those cut ends fall past the
          section's true boundary (beam off the top-right, wrist off the
          bottom-left) — the only edge left visible is the page's own,
          which reads as the art continuing off-screen rather than being
          cropped. The wrapper has no overflow-hidden of its own; the
          section is the sole clip boundary. Sized in vw, capped in px past
          the ~375px baseline so it doesn't keep growing into the tablet
          zone. */}
      <div
        aria-hidden
        className="pointer-events-none relative z-10 mt-2"
        style={{ height: "min(120vw, 450px)" }}
      >
        <Image
          src="/hero/gun.png"
          alt=""
          width={4096}
          height={3119}
          priority
          sizes="670px"
          className="absolute h-auto max-w-none"
          style={{
            width: "min(178.667vw, 670px)",
            left: "max(-16vw, -60px)",
            top: 0,
            transform: "scaleX(-1)",
          }}
        />
      </div>
    </section>
  );
}
