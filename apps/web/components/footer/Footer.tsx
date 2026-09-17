import IconsLowerRight from "./IconsLowerRight";
import TextLowerLeft from "./TextLowerLeft";
import SvgUpperLeft from "./SvgUpperLeft";
import TextUpperRight from "./TextUpperRight";

export default function Footer() {
	return (
		<div id="footer" className="relative flex min-h-0 flex-col justify-between w-full overflow-hidden bg-transparent text-neutral-400 pt-12 pb-6 sm:py-8 lg:min-h-[100svh] lg:h-[100svh] lg:py-[3.5svh]">
			<section className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 min-h-0 grid-cols-1 items-center gap-4 px-4 pt-2 pb-2 sm:gap-6 sm:px-8 lg:grid-cols-2 lg:gap-8">
				<div className="order-2 flex w-full min-h-0 items-center justify-center lg:order-1 lg:h-full">
					<SvgUpperLeft />
				</div>
				<div className="order-1 flex w-full min-h-0 items-center justify-center lg:order-2 lg:h-full">
					<TextUpperRight />
				</div>
			</section>
			<div className="relative z-10 mx-auto flex w-full max-w-7xl shrink-0 flex-col items-center justify-between gap-3 px-4 pt-0 pb-4 sm:flex-row sm:items-end sm:gap-6 sm:px-8 lg:pb-0">
				<TextLowerLeft />
				<IconsLowerRight />
			</div>
		</div>
	);
}