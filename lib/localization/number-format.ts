import {
  DEFAULT_COUNTRY_CODE,
  getCountryConfig,
} from "@/lib/countries";

export interface NumberFormatOptions {
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  notation?: "standard" | "scientific" | "engineering" | "compact";
  signDisplay?: "auto" | "always" | "exceptZero" | "never";
}

export const DEFAULT_NUMBER_LOCALE = "en-UG";

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

export function formatNumber(
  value: number,
  countryCode?: string,
  options: NumberFormatOptions = {},
): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  const locale = resolveLocale(
    countryCode,
    options.locale,
  );

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits:
      options.minimumFractionDigits,
    maximumFractionDigits:
      options.maximumFractionDigits,
    useGrouping:
      options.useGrouping ?? true,
    notation:
      options.notation ?? "standard",
    signDisplay:
      options.signDisplay ?? "auto",
  }).format(value);
}

export function formatInteger(
  value: number,
  countryCode?: string,
): string {
  return formatNumber(value, countryCode, {
    maximumFractionDigits: 0,
  });
}

export function formatDecimal(
  value: number,
  countryCode?: string,
  decimalPlaces = 2,
): string {
  return formatNumber(value, countryCode, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

export function formatCompactNumber(
  value: number,
  countryCode?: string,
): string {
  return formatNumber(value, countryCode, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

export function formatPercentage(
  value: number,
  countryCode?: string,
  decimalPlaces = 2,
): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  const locale = resolveLocale(countryCode);

  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value);
}

export function formatPercentageValue(
  value: number,
  countryCode?: string,
  decimalPlaces = 2,
): string {
  return formatPercentage(
    value / 100,
    countryCode,
    decimalPlaces,
  );
}

export function formatSignedNumber(
  value: number,
  countryCode?: string,
  decimalPlaces = 2,
): string {
  return formatNumber(value, countryCode, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    signDisplay: "always",
  });
}

export function formatRatio(
  numerator: number,
  denominator: number,
  countryCode?: string,
  decimalPlaces = 2,
): string {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return "";
  }

  return formatDecimal(
    numerator / denominator,
    countryCode,
    decimalPlaces,
  );
}

export function formatNumberRange(
  minimum: number,
  maximum: number,
  countryCode?: string,
  decimalPlaces = 0,
): string {
  const formattedMinimum = formatNumber(
    minimum,
    countryCode,
    {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    },
  );

  const formattedMaximum = formatNumber(
    maximum,
    countryCode,
    {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    },
  );

  return `${formattedMinimum}–${formattedMaximum}`;
}

export function parseNumber(
  value: string | number,
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = value
    .trim()
    .replace(/,/g, "");

  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function isValidNumber(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

export function isNonNegativeNumber(
  value: unknown,
): value is number {
  return (
    isValidNumber(value) &&
    value >= 0
  );
}

export function roundNumber(
  value: number,
  decimalPlaces = 2,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const factor = 10 ** decimalPlaces;

  return Math.round(
    (value + Number.EPSILON) * factor,
  ) / factor;
}

export function clampNumber(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum,
  );
}