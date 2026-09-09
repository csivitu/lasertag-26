import { PixelButton } from "./PixelButton";

export function RegisterButton() {
  return (
    <PixelButton
      href="/register"
      label="Register Now"
      className="w-full"
      labelClassName="text-[3.4vw] sm:text-[2vw] lg:text-[1.15vw]"
    />
  );
}
