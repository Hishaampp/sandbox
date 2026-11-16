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
