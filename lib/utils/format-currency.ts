export type CurrencyCode =
  | "UGX"
  | "USD"
  | "EUR"
  | "GBP"
  | "KES"
  | "TZS"
  | "RWF"
  | "ZAR"
  | "NGN"
  | "GHS";

const currencyLocales: Record<CurrencyCode, string> = {
  UGX: "en-UG",
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  KES: "en-KE",
  TZS: "sw-TZ",
  RWF: "rw-RW",
  ZAR: "en-ZA",
  NGN: "en-NG",
  GHS: "en-GH",
};

export function formatCurrency(
  amount: number,
  currency: CurrencyCode = "UGX",
): string {
  return new Intl.NumberFormat(currencyLocales[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "UGX" ? 0 : 2,
  }).format(amount);
}