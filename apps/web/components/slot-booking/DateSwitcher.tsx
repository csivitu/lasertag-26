export interface DateOption {
  day: string;
  month: string;
  active?: boolean;
}

interface DateSwitcherProps {
  dates: DateOption[];
  onSelect: (day: string) => void;
}

const svgBg = (url: string) =>
  `url("${url}") no-repeat center / 100% 100%`;

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
            {/* SVG border box */}
            <div
              className="slot-date-box"
              style={{
                background: svgBg(
                  d.active
                    ? "/slot-booking/date-box-cyan.svg"
                    : "/slot-booking/date-box-pink.svg"
                ),
              }}
            >
              <span className="slot-date-day">{d.day}</span>
              <span className="slot-date-month">{d.month}</span>
            </div>

            {/* Corner tick marks for active date */}
            {d.active && (
              <>
                <span className="date-decor-line date-decor-tl" />
                <span className="date-decor-line date-decor-tr" />
                <span className="date-decor-line date-decor-bl" />
                <span className="date-decor-line date-decor-br" />
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
