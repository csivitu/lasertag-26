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
      "Reserve your time on the CSI LaserTag website — sign in solo to book your slot.",
      // DEPRECATED: team feature disabled — restore team copy below.
      // "Reserve your time on the CSI LaserTag website — sign in solo or create a team.",
      // "For Team, share the team code with up to 5 friends (must be registered on the graVITas website). Only the team leader can book a slot for the entire team.",
    ],
  },
  {
    id: 2,
    accent: "cyan",
    items: [
      "Bring your VIT Student ID to get in. No ID = No entry!",
      "Show up 30 minutes before your game time! Latecomers won't be allowed to play.",
      "If you miss your slot, it's gone for good! No rescheduling will be allowed.",
      "Only those on the official list can play. Make sure your name's on there!",
    ],
  },
  {
    id: 3,
    accent: "yellow",
    items: [
      "If you break any equipment, you'll be on the hook for repairs or replacements.",
      "Stick to the VIT Code of Conduct. Good vibes only!",
      "Your game time is locked in. No extensions, so make every second count!",
      "Work with the organizers and keep things smooth.",
      "Play safe and follow the rules to keep it fun for everyone!",
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
