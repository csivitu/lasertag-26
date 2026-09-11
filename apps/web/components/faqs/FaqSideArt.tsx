import Image from "next/image";

type FaqSideArtProps = {
    isJumping?: boolean;
    isActive?: boolean;
};

export function FaqSideArt({ isJumping = false, isActive = false }: FaqSideArtProps) {
    return (
        <div className="relative h-full w-full">
            <Image
                src={isActive ? "/faq/ralph.png" : "/faq/ralph-calm.png"}
                alt="Wreck-It Ralph pixel art"
                width={129}
                height={143}
                unoptimized
                className="block h-auto w-full md:hidden"
                style={{ imageRendering: "pixelated" }}
            />
            <div className="absolute bottom-0 right-[8%] hidden h-[75%] w-auto md:block">
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