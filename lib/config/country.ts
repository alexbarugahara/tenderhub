export type CountryConfig = {
  code: "US";
  name: "United States";
  currencyCode: "USD";
  phoneCode: "+1";
};

export const countries: CountryConfig[] = [
  {
    code: "US",
    name: "United States",
    currencyCode: "USD",
    phoneCode: "+1",
  },
];

export const defaultCountryCode: CountryConfig["code"] = "US";

export function getCountryByCode(
  code: string | undefined | null,
): CountryConfig | undefined {
  if (!code) return undefined;

  return countries.find(
    (country) =>
      country.code.toUpperCase() === code.trim().toUpperCase(),
  );
}

export function isValidCountryCode(
  code: string | undefined | null,
): boolean {
  return Boolean(getCountryByCode(code));
}