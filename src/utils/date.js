export function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isValidDate(value) {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) && isoDate(date) === value;
}

export function isValidMonth(value) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function formatMonthLabel(month) {
  const date = new Date(`${month}-01T00:00:00`);
  if (!Number.isFinite(date.getTime())) return month;
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function isToday(dateText) {
  return dateText === isoDate(new Date());
}

export function formatDay(dateText) {
  const date = new Date(`${dateText}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return dateText;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
