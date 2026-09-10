/** Shared decoration URLs for the ModePopup component tree. */

export type PopupMode = "solo" | "create_team" | "join_team";

export const MODAL_BORDER_SVG = "/mode-popup/boxborder.svg";
export const INPUT_BORDER_SVG = "/mode-popup/textboxborder.svg";
export const PINK_INPUT_BORDER_SVG = "/mode-popup/team-code-border.svg";

/** CSS background shorthand for a public SVG asset sized to its element. */
export function borderBg(assetUrl: string): string {
  return `url("${assetUrl}") no-repeat center / 100% 100%`;
}
