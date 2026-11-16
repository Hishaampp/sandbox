const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const dateTimeFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** "16 November 2026" — dates shown in India time. */
export function formatDate(value: string | Date) {
  return dateFormat.format(typeof value === "string" ? new Date(value) : value);
}

/** "16 Nov, 9:41 pm" */
export function formatDateTime(value: string | Date) {
  return dateTimeFormat.format(typeof value === "string" ? new Date(value) : value);
}

export function yearLabel(year: number | null | undefined) {
  if (!year) return null;
  const suffix = year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th";
  return `${year}${suffix} year`;
}

/** "today", "6 days ago", "3 weeks ago", "4 months ago", "2 years ago". Call only in per-request code. */
export function timeAgo(value: string | Date, now: Date = new Date()) {
  const then = typeof value === "string" ? new Date(value) : value;
  const days = Math.floor((now.getTime() - then.getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}
