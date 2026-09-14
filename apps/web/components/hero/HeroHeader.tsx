"use client";

import Image from "next/image";

import { playSound } from "@/lib/sound";
import { HeroMenu } from "./HeroMenu";
import { NavArrow } from "./NavArrow";

export const navLinks = [
  { label: "HOME", href: "#home" },
  { label: "ABOUT", href: "#about" },
  { label: "FAQs", href: "#faqs" },
  { label: "SIGN IN", href: "#sign-in" },
];

export function HeroHeader() {
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    playSound("navSelect", 0.5);
    if (href.startsWith("#")) {
      const targetId = href.slice(1);
      const targetElement =
        targetId === "home" || !targetId
          ? document.getElementById("home") || document.documentElement
          : document.getElementById(targetId);

      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: "instant" });
        if (targetId) {
          history.pushState(null, "", `#${targetId}`);
        } else {
          history.pushState(null, "", window.location.pathname);
        }
      }
    }
  };

  return (
    <div className="relative z-20 flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7 lg:px-[var(--hero-gutter)] lg:pt-[1.5vh]">
      <a
        href="#home"
        onClick={(e) => handleNavClick(e, "#home")}
        aria-label="LaserTag home"
        className="block h-12 w-12 shrink-0 rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent lg:h-14 lg:w-14"
      >
        <Image
          src="/hero/logo-badge.png"
          alt=""
          width={240}
          height={240}
          loading="lazy"
          unoptimized
          draggable={false}
          className="size-full object-contain select-none"
        />
      </a>

      <nav
        aria-label="Primary"
        className="hidden items-center gap-[3vw] text-[clamp(13px,1.1vw,18px)] lg:flex"
      >
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onMouseEnter={() => playSound("navHover", 0.4)}
            onClick={(e) => handleNavClick(e, link.href)}
            className="group relative inline-flex items-center whitespace-nowrap font-pixel leading-[1.338] tracking-[0.1em] text-white outline-offset-4 transition-colors duration-150 hover:text-accent focus-visible:text-accent focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none"
          >
            <span
              aria-hidden
              className="nav-arrow-marker pointer-events-none absolute right-full top-1/2 mr-[0.5em] -mt-[0.625em] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <NavArrow />
            </span>
            {link.label}
          </a>
        ))}
      </nav>

      <HeroMenu links={navLinks} />
    </div>
  );
}
