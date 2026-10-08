import {
  DEFAULT_COUNTRY_CODE,
  getCountryConfig,
} from "@/lib/countries";

export interface DateFormatOptions {
  locale?: string;
  timeZone?: string;
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
}

export const DEFAULT_DATE_FORMAT = "dd/MM/yyyy";

export const DEFAULT_TIME_ZONE = "Africa/Kampala";

function resolveLocale(
  countryCode?: string,
  locale?: string,
): string {
  if (locale) {
    return locale;
  }

  return getCountryConfig(
    countryCode ?? DEFAULT_COUNTRY_CODE,
  ).numberLocale;
}

function resolveTimeZone(
  countryCode?: string,
  timeZone?: string,
): string {
  if (timeZone) {
    return timeZone;
  }

  if (countryCode === "US") {
    return "America/New_York";
  }

  return DEFAULT_TIME_ZONE;
}

export function formatDate(
  value: Date | string | number,
  countryCode?: string,
  options: DateFormatOptions = {},
): string {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  const locale = resolveLocale(
    countryCode,
    options.locale,
  );

  const timeZone = resolveTimeZone(
    countryCode,
    options.timeZone,
  );

  return new Intl.DateTimeFormat(locale, {
    dateStyle: options.dateStyle ?? "medium",
    timeZone,
  }).format(date);
}

export function formatDateTime(
  value: Date | string | number,
  countryCode?: string,
  options: DateFormatOptions = {},
): string {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  const locale = resolveLocale(
    countryCode,
    options.locale,
  );

  const timeZone = resolveTimeZone(
    countryCode,
    options.timeZone,
  );

  return new Intl.DateTimeFormat(locale, {
    dateStyle: options.dateStyle ?? "medium",
    timeStyle: options.timeStyle ?? "short",
    timeZone,
  }).format(date);
}

export function formatDateLong(
  value: Date | string | number,
  countryCode?: string,
): string {
  return formatDate(value, countryCode, {
    dateStyle: "long",
  });
}

export function formatDateShort(
  value: Date | string | number,
  countryCode?: string,
): string {
  return formatDate(value, countryCode, {
    dateStyle: "short",
  });
}

export function formatDateTimeLong(
  value: Date | string | number,
  countryCode?: string,
): string {
  return formatDateTime(value, countryCode, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function formatTime(
  value: Date | string | number,
  countryCode?: string,
  timeZone?: string,
): string {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  const locale = resolveLocale(countryCode);

  return new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
    timeZone: resolveTimeZone(
      countryCode,
      timeZone,
    ),
  }).format(date);
}

export function formatDateForInput(
  value: Date | string | number,
): string {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateTimeForInput(
  value: Date | string | number,
): string {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");
  const hours = String(
    date.getHours(),
  ).padStart(2, "0");
  const minutes = String(
    date.getMinutes(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatRelativeDate(
  value: Date | string | number,
  countryCode?: string,
): string {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  const now = new Date();
  const difference =
    date.getTime() - now.getTime();

  const seconds = Math.round(
    difference / 1000,
  );

  const minutes = Math.round(
    seconds / 60,
  );

  const hours = Math.round(
    minutes / 60,
  );

  const days = Math.round(
    hours / 24,
  );

  const locale = resolveLocale(countryCode);

  const formatter = new Intl.RelativeTimeFormat(
    locale,
    {
      numeric: "auto",
    },
  );

  if (Math.abs(seconds) < 60) {
    return formatter.format(
      seconds,
      "second",
    );
  }

  if (Math.abs(minutes) < 60) {
    return formatter.format(
      minutes,
      "minute",
    );
  }

  if (Math.abs(hours) < 24) {
    return formatter.format(
      hours,
      "hour",
    );
  }

  if (Math.abs(days) < 30) {
    return formatter.format(
      days,
      "day",
    );
  }

  if (Math.abs(days) < 365) {
    return formatter.format(
      Math.round(days / 30),
      "month",
    );
  }

  return formatter.format(
    Math.round(days / 365),
    "year",
  );
}

export function isValidDate(
  value: unknown,
): value is Date {
  return (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  );
}

export function toDate(
  value: Date | string | number,
): Date | null {
  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(value);

  return isValidDate(date) ? date : null;
}

export function isDateInPast(
  value: Date | string | number,
): boolean {
  const date = toDate(value);

  return date
    ? date.getTime() < Date.now()
    : false;
}

export function isDateInFuture(
  value: Date | string | number,
): boolean {
  const date = toDate(value);

  return date
    ? date.getTime() > Date.now()
    : false;
}

export function isSameDay(
  first: Date | string | number,
  second: Date | string | number,
): boolean {
  const firstDate = toDate(first);
  const secondDate = toDate(second);

  if (!firstDate || !secondDate) {
    return false;
  }

  return (
    firstDate.getFullYear() ===
      secondDate.getFullYear() &&
    firstDate.getMonth() ===
      secondDate.getMonth() &&
    firstDate.getDate() ===
      secondDate.getDate()
  );
}

export function getStartOfDay(
  value: Date | string | number,
): Date | null {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  date.setHours(0, 0, 0, 0);

  return date;
}

export function getEndOfDay(
  value: Date | string | number,
): Date | null {
  const date = toDate(value);

  if (!date) {
    return null;
  }

  date.setHours(23, 59, 59, 999);

  return date;
}