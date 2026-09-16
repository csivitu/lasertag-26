/**
 * Formats slot date into the desired retro multi-line format:
 * e.g. "18th September,\n2026"
 */
export function formatPassDate(dateStr?: string | null): string {
  if (!dateStr || dateStr === "N/A" || dateStr === "STANDBY" || dateStr === "NOT BOOKED") {
    return "18th September,\n2026";
  }

  if (dateStr.includes("\n")) return dateStr;

  // If already matches "18th September, 2026" or similar
  if (dateStr.includes(",")) {
    const parts = dateStr.split(",");
    if (parts.length === 2) {
      return `${parts[0].trim()},\n${parts[1].trim()}`;
    }
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const IST = "Asia/Kolkata";
    const day = Number(
      new Intl.DateTimeFormat("en-US", { timeZone: IST, day: "numeric" }).format(parsed)
    );
    const nth = (d: number) => {
      if (d > 3 && d < 21) return `${d}th`;
      switch (d % 10) {
        case 1:  return `${d}st`;
        case 2:  return `${d}nd`;
        case 3:  return `${d}rd`;
        default: return `${d}th`;
      }
    };
    const month = parsed.toLocaleDateString("en-US", { month: "long", timeZone: IST });
    const year = parsed.toLocaleDateString("en-US", { year: "numeric", timeZone: IST });
    return `${nth(day)} ${month},\n${year}`;
  }

  return dateStr;
}

/**
 * Formats slot time window into multi-line wrapped text if needed:
 * e.g. "3:29 PM -\n4:29 PM"
 */
export function formatPassTime(timeStr?: string | null): string {
  if (!timeStr || timeStr === "N/A" || timeStr === "STANDBY") {
    return "STANDBY";
  }

  if (timeStr.includes("\n")) return timeStr;

  if (timeStr.includes(" - ")) {
    const [start, end] = timeStr.split(" - ");
    return `${start} -\n${end}`;
  }

  return timeStr;
}
