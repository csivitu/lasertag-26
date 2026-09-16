import Image from "next/image";

type FaqSideArtProps = {
    isJumping?: boolean;
    isActive?: boolean;
};

export function FaqSideArt({ isJumping = false, isActive = false }: FaqSideArtProps) {
    return (
        <div className="relative h-full w-full">
            <div className="absolute bottom-0 right-[3%] hidden w-[clamp(300px,34vw,560px)] lg:right-[5%] lg:block xl:right-[8%]">
                <Image
                    src="/faq/building.webp"
                    alt="Niceland arcade building"
                    width={637}
                    height={820}
                    unoptimized
                    className="h-auto w-full object-contain object-bottom"
                    style={{ imageRendering: "pixelated" }}
                />
                <Image
                    src={isActive ? "/faq/ralph.png" : "/faq/ralph-calm.png"}
                    alt="Wreck-It Ralph pixel art"
                    width={129}
                    height={143}
                    unoptimized
                    className={`absolute left-1/2 w-[20%] -translate-x-1/2 object-contain ${isActive ? "top-[18%]" : "top-[20%]"}${isJumping ? " ralph-jump" : ""}`}
                    style={{ imageRendering: "pixelated" }}
                />
            </div>
        </div>
    );
}