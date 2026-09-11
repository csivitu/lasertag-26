export interface DateOption {
  day: string;
  month: string;
  active?: boolean;
}

interface DateSwitcherProps {
  dates: DateOption[];
  onSelect: (day: string) => void;
}

export function DateSwitcher({ dates, onSelect }: DateSwitcherProps) {
  return (
    <div className="slot-date-switcher flex flex-col items-center">
      {/* "SELECT DATE" label with cyan lines */}
      <div className="slot-date-heading">
        <div />
        <span>SELECT DATE</span>
        <div />
      </div>

      {/* Date boxes */}
      <div className="slot-date-options">
        {dates.map((d, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(d.day)}
            aria-label={`${d.day} ${d.month}`}
            aria-current={d.active ? "page" : undefined}
            className="slot-date-link relative block"
          >
            <div className="slot-date-box">
              <span className="slot-date-day">{d.day}</span>
              <span className="slot-date-month">{d.month}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
