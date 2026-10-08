export type DateFormat =
  | "short"
  | "medium"
  | "long"
  | "full"
  | "dateTime";

export function formatDate(
  value: Date | string | number,
  format: DateFormat = "medium",
): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const options: Record<DateFormat, Intl.DateTimeFormatOptions> = {
    short: {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
    medium: {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
    long: {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
    full: {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
    dateTime: {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  };

  return new Intl.DateTimeFormat("en-GB", options[format]).format(date);
}

export function formatDateOnly(
  value: Date | string | number,
): string {
  return formatDate(value, "medium");
}

export function formatDateTime(
  value: Date | string | number,
): string {
  return formatDate(value, "dateTime");
}