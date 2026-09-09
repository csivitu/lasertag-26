export type FaqColor = "pink" | "yellow" | "cyan";

export type FaqEntry = {
  question: string;
  answer: string;
  color: FaqColor;
};

export const faqItems: FaqEntry[] = [
  {
    question: "Who can participate in Laser Tag?",
    answer:
      "Anyone aged 8 and up can play. Under-12s need a signed guardian waiver, and every player needs closed-toe shoes.",
    color: "pink",
  },
  {
    question: "What should I wear to a game?",
    answer:
      "Dark, comfortable clothing you can move in. Avoid anything with reflective panels — it makes you an easy target.",
    color: "yellow",
  },
  {
    question: "How long does a session last?",
    answer:
      "Each booking is a 45-minute slot: a 10-minute briefing, two 15-minute rounds, and time to check the leaderboard.",
    color: "cyan",
  },
  {
    question: "Do I need to book ahead?",
    answer:
      "Yes — walk-ins are only accepted if a slot is open. Booking online guarantees your squad plays together.",
    color: "pink",
  },
  {
    question: "Is there a minimum group size?",
    answer:
      "Solo players are welcome and get matched into a squad. Private sessions need at least 6 players.",
    color: "yellow",
  },
  {
    question: "What if someone on my team is a first-timer?",
    answer:
      "No problem — every squad gets a 2-minute practice round before the clock starts, and staff walk the floor to help.",
    color: "cyan",
  },

];