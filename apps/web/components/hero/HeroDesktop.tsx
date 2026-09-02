import Image from "next/image";

import { pixelDots, sparkles } from "./heroDecor";

/**
 * Traced 1:1 from the Figma "Landing - Hero" frame (1440 x 1024).
 *
 * Every element is positioned as a percentage of the canvas and every type size
 * is expressed in `cqw`, so the whole scene scales as one piece at any width
 * instead of reflowing. The canvas is the container query root.
 */

const navLinks = [
  { label: "HOME", href: "#", left: 47.85, width: 6.5, color: "#ffffff" },
  { label: "ABOUT", href: "#about", left: 59.71, width: 8.17, color: "#01daec" },
  { label: "FAQs", href: "#faqs", left: 73.24, width: 6.5, color: "#ffffff" },
  { label: "SIGN IN", href: "#sign-in", left: 85.11, width: 11.49, color: "#ffffff" },
];

export function HeroDesktop() {
  return (
    <section className="hidden bg-[#08080d] md:block">
      <div className="relative aspect-[1440/1024] w-full overflow-hidden [container-type:inline-size]">
        {/* Background pixel dots */}
        {pixelDots.map((d, i) => (
          <span
            key={`dot-${i}`}
            aria-hidden
            className="absolute"
            style={{
              left: `${d.l}%`,
              top: `${d.t}%`,
              width: `${d.w}%`,
              height: `${d.h}%`,
              backgroundColor: d.c,
            }}
          />
        ))}

        {/* Vector sparkles */}
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
              width: `${s.w}%`,
              height: `${s.h}%`,
            }}
          />
        ))}

        {/* Laser gun artwork — reproduces the Figma group transform exactly */}
        <div
          aria-hidden
          className="pointer-events-none absolute flex items-center justify-center"
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
                sizes="130vw"
                priority
                className="object-fill"
              />
            </div>
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute flex items-center justify-center"
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

        {/* Logo */}
        <a
          href="#"
          className="absolute"
          style={{ left: "2.6389%", top: "1.4648%", width: "5.5556%", height: "7.8125%" }}
        >
          <Image
            src="/hero/logo-badge.png"
            alt="LaserTag home"
            fill
            sizes="10vw"
            priority
            className="object-contain [image-rendering:pixelated]"
          />
        </a>

        {/* Nav */}
        <nav>
          <span
            aria-hidden
            className="absolute"
            style={{ left: "57.2917%", top: "3.9063%", width: "1.6667%", height: "2.9297%" }}
          >
            <Image
              src="/hero/nav-arrow.png"
              alt=""
              fill
              sizes="5vw"
              className="object-contain [image-rendering:pixelated]"
            />
          </span>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="absolute flex items-center justify-center whitespace-nowrap font-pixel leading-[1.338]"
              style={{
                left: `${link.left}%`,
                top: "4.1%",
                width: `${link.width}%`,
                height: "2.64%",
                color: link.color,
                fontSize: "1.3889cqw",
                letterSpacing: "0.1389cqw",
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Title wordmark — ArcadeClassic is not a web font, so the lettering is
            exported from Figma; the accessible name lives on the heading. */}
        <h1
          className="absolute m-0"
          style={{ left: "37.8472%", top: "41.9922%", width: "56.3889%", height: "9.9609%" }}
        >
          <Image
            src="/hero/title-wordmark.png"
            alt="LaserTag"
            fill
            sizes="60vw"
            priority
            className="object-fill [image-rendering:pixelated]"
          />
        </h1>

        {/* Tagline */}
        <p
          className="absolute flex items-center justify-center text-center font-pixel text-[#23eff1]"
          style={{
            left: "43.611%",
            top: "53.2227%",
            width: "45.4167%",
            height: "6.4453%",
            fontSize: "1.9444cqw",
            lineHeight: "2.7778cqw",
          }}
        >
          From Pixels to Pew Pew
        </p>

        {/* Register CTA */}
        <a
          href="#register"
          className="absolute transition-transform hover:scale-[1.03]"
          style={{ left: "52.4306%", top: "69.1406%", width: "27.7083%", height: "9.2773%" }}
        >
          <Image
            src="/hero/register-button.png"
            alt="Register now"
            fill
            sizes="30vw"
            priority
            className="object-fill [image-rendering:pixelated]"
          />
        </a>
      </div>
    </section>
  );
}
