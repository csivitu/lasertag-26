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
      "Reach out to us at least 2 hours before your session and we'll move you to the next available slot, no extra charge.",
    color: "pink",
  },
  {
    question: "Do I come solo or in a squad?",
    answer:
      "Either works. Solo players get matched into a squad on arrival; groups of 6 or more can book a private session.",
    color: "yellow",
  },
  {
    question: "What's the game time?",
    answer:
      "Each session runs 45 minutes total — a quick briefing, two 15-minute rounds, and a look at the leaderboard.",
    color: "cyan",
  },
  {
    question: "Is it safe?",
    answer:
      "Yes — laser tag uses infrared, not projectiles. All gear is sanitized between sessions and staff run a safety briefing before every game.",
    color: "pink",
  },
  {
    question: "What if I arrive late?",
    answer:
      "You can join mid-round if you're within the first 10 minutes. After that, you'll be slotted into the next available game.",
    color: "yellow",
  },
  {
    question: "Changes & cancellations?",
    answer:
      "Free rescheduling up to 4 hours before your slot. Cancellations within 4 hours forfeit the booking fee.",
    color: "cyan",
  },
  {
    question: "Are there prizes?",
    answer:
      "Top scorer each session gets a free replay, and the weekly leaderboard winner takes home laser tag merch.",
    color: "pink",
  },
];