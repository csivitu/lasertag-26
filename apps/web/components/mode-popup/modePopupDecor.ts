/**
 * Shared decoration data for the ModePopup component tree.
 *
 * The two border SVGs (outer modal box + input field) are the exact pixel-art
 * stepped-corner designs provided by the designer.  Encoding them inline
 * (instead of referencing /public files) means no extra network round-trips
 * and no hydration mismatch between the server-rendered shell and the client
 * rehydration — the SVG content is deterministic from module load.
 *
 * Colours match global.css custom properties:
 *   --cyan:   #23EFF1
 *   --pink:   #F949CC
 *   --yellow: #FEDC02
 */

export type PopupMode = "solo" | "create_team" | "join_team";

/** Cyan (#23EFF1) pixel-stepped corner border for the main modal card. */
export const MODAL_BORDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 864 761" fill="none">
  <path d="M845.836 758.5H13.9885V708.246H2.5V52.7543H6.65649V33.0896H13.9885V2.5H845.836V33.0896H851.168V52.7543H860.5L857.167 708.246H845.836V758.5Z" fill="black" stroke="#23EFF1" stroke-width="3" vector-effect="non-scaling-stroke" />
</svg>`;

/** Same cyan pixel-stepped border for individual input fields, with dark teal fill. */
export const INPUT_BORDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 746 53" fill="none">
  <path d="M1.5 8H9.5V1.5H735V8.51146H743.858V43.5H735V51.0688H9.5V44H1.5V8Z" fill="#112627" stroke="#23EFF1" stroke-width="1.5" vector-effect="non-scaling-stroke" />
</svg>`;

/** Pink variant of the pixel-stepped border for the Create Team code box. */
export const PINK_INPUT_BORDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 746 53" fill="none">
  <path d="M1.5 8H9.5V1.5H735V8.51146H743.858V43.5H735V51.0688H9.5V44H1.5V8Z" fill="#112627" stroke="#F949CC" stroke-width="1.5" vector-effect="non-scaling-stroke" />
</svg>`;

/** Encode an SVG string to a data-URI safe for use in CSS url(). */
export function svgDataUri(svg: string): string {
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** CSS background shorthand that places the border SVG as a non-repeating
 *  background-image sized to 100%×100%, so it always covers the element. */
export function borderBg(svg: string): string {
  return `${svgDataUri(svg)} no-repeat center / 100% 100%`;
}
