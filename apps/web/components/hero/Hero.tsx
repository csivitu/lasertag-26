import { HeroDesktop } from "./HeroDesktop";
import { HeroMobile } from "./HeroMobile";

export function Hero() {
  return (
    <>
      <HeroMobile />
      <HeroDesktop />
    </>
  );
}
