"use client";

import { useState } from "react";

type NavLink = { label: string; href: string };

export function HeroMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[6px] rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span
          className={`h-[3px] w-7 bg-white transition-transform duration-200 ${
            open ? "translate-y-[9px] rotate-45" : ""
          }`}
        />
        <span
          className={`h-[3px] w-7 bg-white transition-opacity duration-200 ${open ? "opacity-0" : ""}`}
        />
        <span
          className={`h-[3px] w-7 bg-white transition-transform duration-200 ${
            open ? "-translate-y-[9px] -rotate-45" : ""
          }`}
        />
      </button>

      {open && (
        <nav
          aria-label="Primary"
          className="absolute left-5 right-5 top-[76px] z-30 flex flex-col overflow-hidden rounded-md border border-white/15 bg-[#0d0d14]/95 backdrop-blur-sm sm:left-8 sm:right-8 sm:top-[88px]"
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-white/10 px-5 py-4 font-pixel text-sm tracking-[1px] text-white outline-offset-[-2px] transition-colors last:border-b-0 focus-visible:outline-2 focus-visible:outline-accent active:text-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
