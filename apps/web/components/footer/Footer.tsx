import IconsLowerRight from "./IconsLowerRight";
import TextLowerLeft from "./TextLowerLeft";
import SvgUpperLeft from "./SvgUpperLeft";
import TextUpperRight from "./TextUpperRight";

export default function Footer() {
	return (
		<div className="w-full bg-black text-neutral-400">
			<section className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-6 px-4 pt-6 pb-2 sm:gap-8 sm:px-8 sm:pt-10 sm:pb-4 lg:grid-cols-2">
				<div className="order-2 flex w-full items-center justify-center lg:order-1">
					<SvgUpperLeft />
				</div>
				<div className="order-1 flex w-full items-center justify-center lg:order-2">
					<TextUpperRight />
				</div>
			</section>
			<div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-4 pt-2 pb-6 sm:flex-row sm:items-end sm:px-8 sm:pt-4 sm:pb-8">
				<TextLowerLeft />
				<IconsLowerRight />
			</div>
		</div>
	);
}