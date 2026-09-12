import Image from "next/image";

type FaqSideArtProps = {
    isJumping?: boolean;
    isActive?: boolean;
};

export function FaqSideArt({ isJumping = false, isActive = false }: FaqSideArtProps) {
    return (
        <div className="relative h-full w-full">
            <div className="absolute bottom-0 right-[3%] lg:right-[5%] xl:right-[8%] hidden h-[65%] lg:h-[70%] xl:h-[75%] max-h-[min(72vh,680px)] w-auto md:block">
                <Image
                    src="/faq/building.png"
                    alt="Niceland arcade building"
                    width={637}
                    height={820}
                    unoptimized
                    className="h-full w-auto object-contain object-bottom"
                    style={{ imageRendering: "pixelated" }}
                />
                <Image
                    src={isActive ? "/faq/ralph.png" : "/faq/ralph-calm.png"}
                    alt="Wreck-It Ralph pixel art"
                    width={129}
                    height={143}
                    unoptimized
                    className={`absolute left-1/2 top-[18%] w-[20%] -translate-x-1/2 object-contain${isJumping ? " ralph-jump" : ""}`}
                    style={{ imageRendering: "pixelated" }}
                />
            </div>
        </div>
    );
}