export function FaqSideArt() {
    return (
        <div className="relative h-full w-full">
            <img
                src="/faq/ralph.png"
                alt="Wreck-It Ralph pixel art"
                className="block h-auto w-full lg:hidden"
                style={{ imageRendering: "pixelated" }}
            />
            <img
                src="/faq/wreck-it-ralph.png"
                alt="Wreck-It Ralph pixel art arcade building"
                className="absolute bottom-0 right-[8%] hidden h-[75%] w-auto object-contain object-bottom lg:block"
                style={{ imageRendering: "pixelated" }}
            />
        </div>
    );
}