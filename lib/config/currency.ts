export type CurrencyConfig = {
  code: "USD";
  name: "US Dollar";
  symbol: "$";
  decimals: 2;
};

export const currencies: CurrencyConfig[] = [
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    decimals: 2,
  },
];

export const defaultCurrencyCode: CurrencyConfig["code"] = "USD";

export function getCurrencyByCode(
  code: string | undefined | null,
): CurrencyConfig | undefined {
  if (!code) return undefined;

  return currencies.find(
    (currency) =>
      currency.code.toUpperCase() === code.trim().toUpperCase(),
  );
}

export function isValidCurrencyCode(
  code: string | undefined | null,
): boolean {
  return Boolean(getCurrencyByCode(code));
}

export function formatCurrency(
  amount: number,
  currencyCode: CurrencyConfig["code"] = defaultCurrencyCode,
): string {
  const currency = getCurrencyByCode(currencyCode);

  if (!currency) {
    return amount.toLocaleString("en-US");
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.code,
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount);
}