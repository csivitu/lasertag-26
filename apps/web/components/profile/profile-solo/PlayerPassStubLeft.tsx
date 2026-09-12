import Image from "next/image";

export function PlayerPassStubLeft() {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-3 py-4 select-none">
      <div className="relative flex items-center justify-center w-12 sm:w-14 h-[85%] max-h-[360px] p-2">
        {/* Cyan corner brackets (top-left, top-right, bottom-left, bottom-right) */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#23eff1]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#23eff1]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#23eff1]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#23eff1]" />

        {/* Vertical LASERTAG wordmark */}
        <div className="relative w-full h-full max-h-[320px]">
          <Image
            src="/profile/profile-solo/LASERTAG.svg"
            alt="LASERTAG"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
