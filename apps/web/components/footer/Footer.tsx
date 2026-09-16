import IconsLowerRight from "./IconsLowerRight";
import TextLowerLeft from "./TextLowerLeft";
import SvgUpperLeft from "./SvgUpperLeft";
import TextUpperRight from "./TextUpperRight";
import { Starfield } from "@/components/hero/Starfield";

export default function Footer() {
	return (
		<div id="footer" className="relative w-full overflow-hidden bg-black text-neutral-400">
			<Starfield />
			<section className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-6 px-4 pt-6 pb-2 sm:gap-8 sm:px-8 sm:pt-10 sm:pb-4 lg:grid-cols-2">
				<div className="order-2 flex w-full items-center justify-center lg:order-1">
					<SvgUpperLeft />
				</div>
				<div className="order-1 flex w-full items-center justify-center lg:order-2">
					<TextUpperRight />
				</div>
			</section>
			<div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 pt-0 pb-6 sm:flex-row sm:items-end sm:gap-6 sm:px-8 sm:pt-2 sm:pb-8">
				<TextLowerLeft />
				<IconsLowerRight />
			</div>
		</div>
	);
}