export function relativeTime(input: string | number | Date) {
  const value = new Date(input).getTime();
  if (Number.isNaN(value)) return "moments ago";
  const diff = Date.now() - value;
  const minute = 60 * 1000;
  if (diff < minute) return "moments ago";
  if (diff < 60 * minute) return `${Math.floor(diff / minute)}m ago`;
  const hour = 60 * minute;
  if (diff < 24 * hour) return `${Math.floor(diff / hour)}h ago`;
  const day = 24 * hour;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  const week = 7 * day;
  if (diff < 4 * week) return `${Math.floor(diff / week)}w ago`;
  const month = 30 * day;
  if (diff < 12 * month) return `${Math.floor(diff / month)}mo ago`;
  return `${Math.floor(diff / (365 * day))}y ago`;
}
