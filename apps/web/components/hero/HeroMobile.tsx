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
            className="group relative block w-[72%] max-w-xs overflow-hidden rounded-full outline-offset-4 transition-[transform,filter] duration-150 focus-visible:outline-2 focus-visible:outline-[#01daec] active:translate-y-0.5 motion-reduce:transition-none"
          >
            {/* Same real pressed-state export as desktop (399x87 vs resting
                399x95), bottom-anchored and cross-faded on :active so the
                button's own footprint never shifts when pressed. */}
            <Image
              src="/hero/register-button.png"
              alt="Register now"
              width={1197}
              height={285}
              priority
              unoptimized
              className="h-auto w-full opacity-100 transition-opacity duration-75 group-active:opacity-0"
            />
            <Image
              src="/hero/register-button-pressed.png"
              alt=""
              aria-hidden
              width={1197}
              height={261}
              unoptimized
              className="absolute inset-x-0 bottom-0 h-auto w-full opacity-0 transition-opacity duration-75 group-active:opacity-100"
            />
            {/* Same arcade shine as desktop — inert on pure touch (no hover),
                free for hybrid mouse+touch devices. */}
            <span
              aria-hidden
              className="button-shine pointer-events-none absolute inset-y-0 left-0 w-1/3"
              style={{
                background:
                  "linear-gradient(75deg, transparent, rgba(255,255,255,0.6) 45%, rgba(255,255,255,0.15) 55%, transparent)",
                transform: "translateX(-160%) skewX(-20deg)",
              }}
            />
          </a>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none relative z-10 mt-2 flex h-[min(95vw,420px)] items-center justify-center overflow-hidden"
      >
        <div
          className="relative flex-none overflow-hidden"
          style={{
            width: "175%",
            height: "175%",
            transform: "rotate(166.1deg) scaleY(-1)",
          }}
        >
          <div className="absolute left-0 top-0 h-[100.38%] w-[102.13%]">
            <Image
              src="/hero/gun.png"
              alt=""
              fill
              sizes="180vw"
              priority
              className="object-fill"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
