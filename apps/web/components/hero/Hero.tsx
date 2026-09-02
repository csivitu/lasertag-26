import { GunGraphic } from "./GunGraphic";
import { Logo } from "./Logo";
import { Nav } from "./Nav";
import { RegisterButton } from "./RegisterButton";
import { Sparkles } from "./Sparkles";

const titleGradient = {
  backgroundImage:
    "linear-gradient(-77deg, rgb(255, 222, 119) 4.5%, rgb(255, 196, 16) 54%, rgb(255, 229, 149) 103%)",
};

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black px-6 pb-16 pt-6 md:px-16 md:pb-24 md:pt-10">
      <div className="md:hidden">
        <Sparkles variant="mobile" />
      </div>
      <div className="hidden md:block">
        <Sparkles variant="desktop" />
      </div>

      <header className="relative z-10 mb-16 hidden items-center justify-between md:flex">
        <Logo />
        <Nav />
      </header>

      <div className="relative z-10 mb-8 flex justify-center md:hidden">
        <Logo />
      </div>

      {/* Mobile: stacked flow */}
      <div className="relative z-10 flex flex-col items-center text-center md:hidden">
        <p
          className="-skew-x-8 whitespace-nowrap bg-clip-text font-arcade text-[11.5vw] leading-none text-transparent [text-shadow:4px_4px_0_#e5349e]"
          style={titleGradient}
        >
          LASERTAG
        </p>
        <p className="mt-4 whitespace-nowrap font-pixel text-[3.4vw] tracking-[1px] text-[#23eff1] sm:text-base">
          From Pixels to Pew Pew
        </p>
        <GunGraphic variant="mobile" />
      </div>

      {/* Desktop: gun column + right-aligned text column */}
      <div className="relative hidden min-h-[640px] md:flex md:items-center">
        <div className="relative h-[560px] w-[34%] shrink-0">
          <GunGraphic variant="desktop" />
        </div>
        <div className="relative z-10 flex min-w-0 flex-1 flex-col items-end pr-8 text-right lg:pr-16">
          <p
            className="-skew-x-8 whitespace-nowrap bg-clip-text font-arcade text-[9vw] leading-none text-transparent [text-shadow:8px_8px_0_#e5349e]"
            style={titleGradient}
          >
            LASERTAG
          </p>
          <p className="mt-6 font-pixel text-2xl tracking-[2px] text-[#23eff1] lg:text-[28px]">
            From Pixels to Pew Pew
          </p>
          <div className="mt-14">
            <RegisterButton />
          </div>
        </div>
      </div>
    </section>
  );
}
