import {
  getCountryConfig,
  DEFAULT_COUNTRY_CODE,
} from "@/lib/countries";

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  decimalDigits: number;
}

export const DEFAULT_CURRENCY_CODE = "UGX";

export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  UGX: {
    code: "UGX",
    name: "Ugandan Shilling",
    symbol: "UGX",
    locale: "en-UG",
    decimalDigits: 0,
  },

  USD: {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    locale: "en-US",
    decimalDigits: 2,
  },

  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    locale: "en-GB",
    decimalDigits: 2,
  },

  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    locale: "en-IE",
    decimalDigits: 2,
  },

  CAD: {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "C$",
    locale: "en-CA",
    decimalDigits: 2,
  },

  AUD: {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
    locale: "en-AU",
    decimalDigits: 2,
  },

  KES: {
    code: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
    locale: "en-KE",
    decimalDigits: 2,
  },

  TZS: {
    code: "TZS",
    name: "Tanzanian Shilling",
    symbol: "TSh",
    locale: "sw-TZ",
    decimalDigits: 0,
  },

  RWF: {
    code: "RWF",
    name: "Rwandan Franc",
    symbol: "FRw",
    locale: "rw-RW",
    decimalDigits: 0,
  },
};

export function getCurrencyConfig(
  currencyCode?: string,
): CurrencyConfig {
  const normalizedCode =
    currencyCode?.trim().toUpperCase() ||
    DEFAULT_CURRENCY_CODE;

  return (
    CURRENCY_CONFIGS[normalizedCode] ??
    CURRENCY_CONFIGS[DEFAULT_CURRENCY_CODE]
  );
}

export function currencyExists(
  currencyCode: string,
): boolean {
  return Boolean(
    CURRENCY_CONFIGS[currencyCode.trim().toUpperCase()],
  );
}

export function getCurrencyCodes(): string[] {
  return Object.keys(CURRENCY_CONFIGS);
}

export function getCurrencyConfigs(): CurrencyConfig[] {
  return Object.values(CURRENCY_CONFIGS);
}

export function getCurrencyName(
  currencyCode: string,
): string {
  return getCurrencyConfig(currencyCode).name;
}

export function getCurrencySymbol(
  currencyCode: string,
): string {
  return getCurrencyConfig(currencyCode).symbol;
}

export function getCurrencyLocale(
  currencyCode: string,
): string {
  return getCurrencyConfig(currencyCode).locale;
}

export function getCurrencyDecimalDigits(
  currencyCode: string,
): number {
  return getCurrencyConfig(currencyCode).decimalDigits;
}

export function getCurrencyForCountry(
  countryCode: string = DEFAULT_COUNTRY_CODE,
): CurrencyConfig {
  const country = getCountryConfig(countryCode);

  return getCurrencyConfig(country.currencyCode);
}

export function formatCurrency(
  amount: number,
  currencyCode?: string,
  options?: Intl.NumberFormatOptions,
): string {
  const config = getCurrencyConfig(currencyCode);

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: config.decimalDigits,
    maximumFractionDigits: config.decimalDigits,
    ...options,
  }).format(amount);
}

export function formatCurrencyCompact(
  amount: number,
  currencyCode?: string,
): string {
  const config = getCurrencyConfig(currencyCode);

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatCurrencyValue(
  amount: number,
  currencyCode?: string,
): string {
  const config = getCurrencyConfig(currencyCode);

  return new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.decimalDigits,
    maximumFractionDigits: config.decimalDigits,
  }).format(amount);
}

export function parseCurrencyAmount(
  value: string | number,
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = value
    .trim()
    .replace(/[^0-9.-]/g, "");

  if (!normalized) {
    return 0;
  }

  const amount = Number(normalized);

  return Number.isFinite(amount) ? amount : 0;
}

export function isValidCurrencyAmount(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}