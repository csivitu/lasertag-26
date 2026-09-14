"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { HeroMenu } from "./HeroMenu";
import { NavArrow } from "./NavArrow";
import { AuthModal } from "../auth/AuthModal";
import { useSession, signOut } from "@/lib/auth-client";

export function HeroHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  function handleNavClick(e: React.MouseEvent, link: { label: string; href: string }) {
    if (link.label === "SIGN IN") {
      e.preventDefault();
      setAuthMode("signin");
      setAuthOpen(true);
      return;
    }
    if (link.label === "SIGN OUT") {
      e.preventDefault();
      signOut();
      return;
    }
    if (link.href.startsWith("/#") || link.href.startsWith("#")) {
      if (pathname !== "/") {
        e.preventDefault();
        router.push("/" + link.href.replace(/^#/, ""));
      }
    }
  }

  // Only show the new features after the user is authenticated/signed in.
  // Otherwise, show the original previous navbar (HOME, ABOUT, FAQs, SIGN IN).
  const navLinks = session?.user
    ? [
        { label: "HOME", href: "/" },
        { label: "ARENA MODES", href: "/register" },
        { label: "BOOK SLOT", href: "/slot-booking" },
        { label: "MY PASS", href: "/profile" },
        { label: "SIGN OUT", href: "#sign-out" },
      ]
    : [
        { label: "HOME", href: "#" },
        { label: "ABOUT", href: "#about" },
        { label: "FAQs", href: "#faqs" },
        { label: "SIGN IN", href: "#sign-in" },
      ];

  return (
    <header className="relative z-20 flex w-full items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7 lg:px-[var(--hero-gutter,3.4vw)] lg:pt-[1.5vh]">
      <Link
        href="/"
        aria-label="LaserTag home"
        className="block h-12 w-12 shrink-0 rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent lg:h-14 lg:w-14"
      >
        <Image
          src="/hero/logo-badge.png"
          alt="LaserTag Logo"
          width={240}
          height={240}
          priority
          unoptimized
          className="size-full object-contain"
        />
      </Link>

      <nav
        aria-label="Primary"
        className="hidden items-center gap-[3vw] text-[clamp(13px,1.1vw,18px)] lg:flex"
      >
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            onClick={(e) => handleNavClick(e, link)}
            className="group relative inline-flex items-center whitespace-nowrap font-pixel leading-[1.338] tracking-[0.1em] text-white outline-offset-4 transition-colors duration-150 hover:text-accent focus-visible:text-accent focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none"
          >
            <span
              aria-hidden
              className="nav-arrow-marker pointer-events-none absolute right-full top-1/2 mr-[0.5em] -mt-[0.625em] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <NavArrow />
            </span>
            {link.label}
          </Link>
        ))}
      </nav>

      <HeroMenu
        links={navLinks}
        onNavClick={(label) => {
          if (label === "SIGN IN") {
            setAuthMode("signin");
            setAuthOpen(true);
          } else if (label === "SIGN OUT") {
            signOut();
          } else if (label === "HOME") {
            router.push("/");
          } else if (label === "ABOUT") {
            if (pathname !== "/") router.push("/#about");
          } else if (label === "FAQs") {
            if (pathname !== "/") router.push("/#faqs");
          } else if (label === "ARENA MODES") {
            router.push("/register");
          } else if (label === "BOOK SLOT") {
            router.push("/slot-booking");
          } else if (label === "MY PASS") {
            router.push("/profile");
          }
        }}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />
    </header>
  );
}
