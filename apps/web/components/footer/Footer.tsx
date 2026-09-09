import IconsLowerRight from "./IconsLowerRight";
import TextLowerLeft from "./TextLowerLeft";
 
export default function Footer() {
	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 bg-black px-4 pt-2 pb-6 text-neutral-400 sm:flex-row sm:items-end sm:px-8 sm:pt-4 sm:pb-8">
			<TextLowerLeft />
			<IconsLowerRight />
		</div>
	);
}