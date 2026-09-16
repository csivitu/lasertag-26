export type FaqColor = "pink" | "yellow" | "cyan";

export type FaqEntry = {
  question: string;
  answer: string;
  color: FaqColor;
};

export const faqItems: FaqEntry[] = [
  {
    question: "What if my slot clashes?",
    answer:
      "Worry not, shift your booking anytime once the portal's live.",
    color: "pink",
  },
  {
    question: "Do I come solo or in a squad?",
    answer:
      "Either works! Come solo and we'll squad you up, or bring your crew.",
    color: "yellow",
  },
  {
    question: "What's the game time?",
    answer:
      "Each session runs 45 minutes total — a quick briefing, two 15-minute rounds (LaserTag and XGT Hado VR Experience respectively).",
    color: "cyan",
  },
  {
    question: "Is it safe?",
    answer:
      "Take a chill pill! It's just harmless infrared beams.",
    color: "pink",
  },
  {
    question: "What if I arrive late?",
    answer:
      "We'll try to sneak you into the next round, but no guarantees.",
    color: "yellow",
  },
  {
    question: "Changes & cancellations?",
    answer:
      "Reschedule if you tell us early (if slots are free). No cancellations/refunds.",
    color: "cyan",
  },
  {
    question: "Are there prizes?",
    answer:
      "No physical ones, just pure bragging rights!",
    color: "pink",
  },
];