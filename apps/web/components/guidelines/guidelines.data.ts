export type RuleAccent = "pink" | "cyan" | "yellow";

export type RuleCardData = {
  id: number;
  accent: RuleAccent;
  items: string[];
};

export const ruleCards: RuleCardData[] = [
  {
    id: 1,
    accent: "pink",
    items: [
      "Participants are requested to report to the venue 15 minutes prior to their respective slots.",
      "Personal bubbles: Maintain a safe distance while playing to ensure the game is an enjoyable experience for all.",
    ],
  },
  {
    id: 2,
    accent: "cyan",
    items: [
      "Running, jumping or climbing is strictly prohibited in the arena.",
      "The gun must be held with both hands at all times to avoid damage.",
      "Ensure that the vest sensors are not blocked for the duration of the game.",
      "All personal vengeances stand nullified in the arena. Violence, threats or abuse of any form will not be tolerated.",
    ],
  },
  {
    id: 3,
    accent: "yellow",
    items: [
      "Vandalizing the equipment or set-up of the arena is strictly prohibited. Players doing so will be removed from the arena and charged appropriately.",
      "Decisions taken by the CSI manager present at the venue will be final in case of any game-time disputes.",
    ],
  },
];

/**
 * Measured from Figma (node 893:21952, "Vector 447"): a two-step chevron
 * notch at each corner, matching the arcade frame language used elsewhere
 * (register button, nav arrow). Stretched non-uniformly per card via
 * preserveAspectRatio="none" — card height varies with copy length, and a
 * slightly stretched corner reads fine on a decorative border.
 */
export const CARD_FRAME_VIEWBOX = "0 0 845 173";
export const CARD_FRAME_PATH =
  "M828.252 170.5H19.9865V159.332H2.5V13.6676H12.8624V9.29769H19.9865V2.5H828.252V9.29769H833.433V13.6676H842.5V159.332H828.252V170.5Z";
