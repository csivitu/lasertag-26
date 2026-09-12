export type SlotState = "available" | "booked" | "few_seats" | "full";

export interface SlotCardProps {
  time: string;
  seatsLabel: string;
  state: SlotState;
  onClick?: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
}

const svgBg = (url: string) =>
  `url("${url}") no-repeat center / 100% 100%`;

const stateConfig: Record<
  SlotState,
  { bg: string; timeColor: string; labelColor: string }
> = {
  available: {
    bg: svgBg("/slot-booking/slot-default.svg"),
    timeColor: "#ffffff",
    labelColor: "#23eff1",
  },
  booked: {
    bg: svgBg("/slot-booking/slot-booked.svg"),
    timeColor: "#000000",
    labelColor: "#000000",
  },
  few_seats: {
    bg: svgBg("/slot-booking/slot-few.svg"),
    timeColor: "#000000",
    labelColor: "#000000",
  },
  full: {
    bg: svgBg("/slot-booking/slot-full.svg"),
    timeColor: "#ffffff",
    labelColor: "rgba(255,255,255,0.85)",
  },
};

export function SlotCard({
  time,
  seatsLabel,
  state,
  onClick,
  isSelected = false,
  isDisabled = false,
}: SlotCardProps) {
  const { bg, timeColor, labelColor } = stateConfig[state];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-pressed={isSelected}
      style={{ background: bg }}
      className="slot-card"
    >
      {/* Time — Press Start 2P, 20px as per Figma */}
      <span
        className="slot-card-time"
        style={{
          color: timeColor,
        }}
      >
        {time}
      </span>

      {/* Seat count — Press Start 2P, smaller */}
      <span
        className="slot-card-label"
        style={{
          color: labelColor,
        }}
      >
        {seatsLabel}
      </span>
    </button>
  );
}
