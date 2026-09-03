import type { CSSProperties } from "react";
import Image from "next/image";

import { pixelDots, sparkles } from "./heroDecor";

// Deterministic pseudo-random in [min, max), seeded by index so every star
// gets a fixed but varied twinkle timing (same on every render, no client/
// server mismatch risk) instead of all 169 marks flickering in lockstep.
function seededRange(seed: number, min: number, max: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return min + frac * (max - min);
}

// Blocky, stepped opacity flicker — steps() rather than an eased fade, to
// match the arcade/pixel-art treatment used elsewhere (nav marker, etc.)
// rather than a smooth "modern web" twinkle.
function twinkleStyle(seed: number): CSSProperties {
  return {
    animation: `star-twinkle ${seededRange(seed, 1.6, 3.6).toFixed(2)}s steps(4, jump-none) infinite`,
    animationDelay: `${seededRange(seed * 7.3 + 1, 0, 3).toFixed(2)}s`,
  };
}

/**
 * Fluid desktop hero, calibrated against the Figma "Landing - Hero" frame.
 *
 * At a 1440x1024 viewport this renders identically to the frame; wider or
 * shorter viewports redistribute the extra space rather than letterboxing.
 *
 * Two independent scales drive the layout:
 *   - artwork and background scale with hero *height* (via `cqh`), so the gun
 *     never bloats on ultrawide and the scene always fills exactly one screen;
 *   - type and the content block scale with *width*, clamped at both ends.
 *
 * Design values are quoted in frame pixels: 1 design px = (100/1024)cqh
 * vertically, and horizontal percentages are of the 1440px-wide frame.
 */

// The header keeps a real inset from the screen edges — this is no longer
// tied to the Figma frame's own 38px/49px values, just a sensible gutter
// for a full-width site header. The content column reuses the same value
// so the whole hero reads as one consistent rhythm.
const GUTTER_R = "var(--gutter-r)";

// Everything is measured off the hero's *height*, in `cqh` (1cqh = 1% of hero
// height), because that is the dimension the frame is composed against. The
// artwork is height-driven too, so the whole scene scales as a single unit and
// keeps the frame's internal proportions at any viewport. Extra width simply
// becomes breathing room between the gun and the text.
//
// 1 design px = (100/1024)cqh = 0.09766cqh.

// 20px at the reference size. The rest of the header is sized in `em` off
// this, so the bar scales as one unit: logo 4em, link gap 3.865em.
//
// On a tall-but-narrow viewport the height-driven size alone can demand
// more width than is available inside the two gutters — the nav is nowrap
// and can't shrink, so it would overflow past the edge. The second min()
// term is a solved width ceiling: nav content plus the 4em logo is
// 37.5868em wide, so font-size <= (100cqw - 2*gutter) / 38 (38 instead of
// the exact 37.5868 leaves a small safety margin) always leaves the row
// fitting between the gutters. It only engages when height and width
// diverge this far — inert at the 1440x1024 reference ratio and 1920x1080.
const NAV_FONT =
  "max(13px, min(1.9531cqh, calc((100cqw - 2 * var(--gutter-r)) / 38)))";

// Left edge of the content column (design x=511), tied to height so the column
// tracks the gun. Centring the block here puts it at x=951, as in the frame.
const COLUMN_L = "var(--column-l)";

// The wordmark's width drives the whole content block: 812px in the frame, from
// which the tagline (28px) and CTA (399px) are derived proportionally.
//
// The second term keeps it inside the content column on narrow-but-tall
// windows. Both terms are absolute units — a percentage here would resolve
// against font-size rather than width, and `--cw` feeds the tagline's.
//
// These compose through CSS custom properties rather than by interpolating one
// JS constant into another, so the declarations carry no ordering hazard.
const WORDMARK_W = "min(79.297cqh, calc(100cqw - var(--column-l) - var(--gutter-r)))";

const navLinks = [
  { label: "HOME", href: "#" },
  { label: "ABOUT", href: "#about" },
  { label: "FAQs", href: "#faqs" },
  { label: "SIGN IN", href: "#sign-in" },
];

export function HeroDesktop() {
  return (
    <section
      className="relative hidden h-[100svh] min-h-[640px] overflow-hidden bg-[#08080d] lg:block"
      style={
        {
          containerType: "size",
          "--gutter-r": "clamp(24px, 3.4028vw, 72px)",
          "--column-l": "58cqh",
        } as CSSProperties
      }
    >
      {/* Background pixel dots. Positions stretch across the hero; sizes are
          height-driven so the marks stay square at any aspect ratio. */}
      {pixelDots.map((d, i) => (
        <span
          key={`dot-${i}`}
          aria-hidden
          className="absolute"
          style={{
            left: `${d.l}%`,
            top: `${d.t}%`,
            width: `${(d.w * 1.40625).toFixed(4)}cqh`,
            height: `${d.h}cqh`,
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
            width: `${(s.w * 1.40625).toFixed(4)}cqh`,
            height: `${s.h}cqh`,
            ...twinkleStyle(pixelDots.length + i),
          }}
        />
      ))}

      {/* Artwork layer. This box is the frame's own coordinate space scaled to
          the hero height. Enlarged (1.18x) and nudged right of its Figma
          position — scaled from the bottom-left corner so the anchored hand
          stays put while the beam/muzzle grow up and to the right. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 aspect-[1440/1024] h-full"
        style={{ left: "6.5cqh", transform: "scale(1.18)", transformOrigin: "0% 100%" }}
      >
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: "-20.3639%",
            top: "-47.4922%",
            width: "117.7733%",
            height: "149.091%",
          }}
        >
          <div
            className="relative flex-none overflow-hidden"
            style={{
              width: "81.9353%",
              height: "70.5202%",
              transform: "rotate(157.48deg) scaleY(-1)",
            }}
          >
            <div className="absolute left-0 top-0 h-[100.38%] w-[102.13%]">
              <Image
                src="/hero/gun.png"
                alt=""
                fill
                sizes="70vw"
                priority
                className="object-fill"
              />
            </div>
          </div>
        </div>

        <div
          className="absolute flex items-center justify-center"
          style={{
            left: "8.0819%",
            top: "94.3184%",
            width: "15.867%",
            height: "20.425%",
          }}
        >
          <div
            className="flex-none"
            style={{
              width: "81.426%",
              height: "72.7538%",
              transform: "rotate(-21.2deg) scaleY(-1)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero/gun-spark.svg" alt="" className="block size-full max-w-none" />
          </div>
        </div>
      </div>

      {/* Header: logo hard left, links hard right */}
      <div
        className="absolute flex items-center justify-between"
        style={{
          left: GUTTER_R,
          right: GUTTER_R,
          top: "1.4648%",
          fontSize: NAV_FONT,
        }}
      >
        <a
          href="#"
          aria-label="LaserTag home"
          className="block shrink-0 rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#01daec]"
          style={{ width: "4em", height: "4em" }}
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

        <nav className="flex items-center" style={{ gap: "3.865em" }}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group relative inline-flex items-center whitespace-nowrap font-pixel leading-[1.338] text-white outline-offset-4 transition-colors duration-150 hover:text-[#01daec] focus-visible:text-[#01daec] focus-visible:outline-2 focus-visible:outline-[#01daec] motion-reduce:transition-none"
              style={{ letterSpacing: "0.1em" }}
            >
              <Image
                src="/hero/nav-arrow.png"
                alt=""
                aria-hidden
                width={72}
                height={90}
                priority
                unoptimized
                className="nav-arrow-marker pointer-events-none absolute object-contain opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                style={{
                  right: "100%",
                  marginRight: "0.85em",
                  top: "50%",
                  marginTop: "-0.75em",
                  width: "1.2em",
                  height: "1.5em",
                }}
              />
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Content block, centred in the column between the gun and the right
          gutter. `--cw` drives the wordmark, tagline and CTA together. */}
      <div
        className="absolute flex flex-col items-center"
        style={
          {
            left: COLUMN_L,
            right: GUTTER_R,
            top: "60.205%",
            transform: "translateY(-50%)",
            "--cw": WORDMARK_W,
          } as CSSProperties
        }
      >
        {/* ArcadeClassic is not a web font, so the lettering is exported from
            Figma; the accessible name lives on the heading. */}
        <h1 className="m-0 w-full">
          <Image
            src="/hero/title-wordmark.png"
            alt="LaserTag"
            width={2436}
            height={309}
            priority
            unoptimized
            className="mx-auto h-auto max-w-full"
            style={{ width: "var(--cw)" }}
          />
        </h1>

        <p
          className="tagline-crt-glitch relative flex items-center justify-center text-center font-pixel text-[#23eff1]"
          style={{
            fontSize: "calc(var(--cw) * 0.034483)",
            marginTop: "max(6px, 1.2695cqh)",
            height: "max(2.357em, 6.4453cqh)",
          }}
        >
          From Pixels to{" "}
          {/* Only "Pew Pew" types out — width animates 0 -> 7ch (Press
              Start 2P is monospace, so ch is exact) rather than clip-path,
              because growing the box's real layout width is what makes the
              cursor after it get pushed along by ordinary reflow instead of
              sitting fixed at its final position from mount. One-time; the
              CRT glitch on the parent <p> and the cursor blink are both
              independent infinite animations unaffected by this finishing. */}
          <span className="pew-pew-typewriter inline-block overflow-hidden whitespace-nowrap">
            Pew Pew
          </span>
          {/* Terminal-style blinking cursor block, pushed along by the
              typewriter span's growing width so it tracks the reveal. */}
          <span aria-hidden className="cursor-blink ml-[0.25em] inline-block bg-[#23eff1]" style={{ width: "0.55em", height: "0.85em" }} />
        </p>

        <a
          href="#register"
          className="block rounded-full outline-offset-4 transition-[transform,filter] duration-150 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-[#01daec] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          style={{
            marginTop: "max(28px, 9.4727cqh)",
            width: "calc(var(--cw) * 0.491379)",
            maxWidth: "100%",
          }}
        >
          <Image
            src="/hero/register-button.png"
            alt="Register now"
            width={1197}
            height={285}
            priority
            unoptimized
            className="h-auto w-full"
          />
        </a>
      </div>
    </section>
  );
}
