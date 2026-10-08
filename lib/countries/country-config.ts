export interface CountryConfig {
  code: string;
  name: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  dateFormat: string;
  numberLocale: string;
  phoneCode: string;
  procurementTerminology: {
    solicitation: string;
    bid: string;
    vendor: string;
    organization: string;
    award: string;
    contract: string;
  };
}

export const DEFAULT_COUNTRY_CODE = "UG";

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  UG: {
    code: "UG",
    name: "Uganda",
    currencyCode: "UGX",
    currencyName: "Ugandan Shilling",
    currencySymbol: "UGX",
    dateFormat: "dd/MM/yyyy",
    numberLocale: "en-UG",
    phoneCode: "+256",
    procurementTerminology: {
      solicitation: "Solicitation",
      bid: "Bid",
      vendor: "Vendor",
      organization: "Organization",
      award: "Award",
      contract: "Contract",
    },
  },

  US: {
    code: "US",
    name: "United States",
    currencyCode: "USD",
    currencyName: "US Dollar",
    currencySymbol: "$",
    dateFormat: "MM/dd/yyyy",
    numberLocale: "en-US",
    phoneCode: "+1",
    procurementTerminology: {
      solicitation: "Solicitation",
      bid: "Bid",
      vendor: "Vendor",
      organization: "Organization",
      award: "Award",
      contract: "Contract",
    },
  },

  GB: {
    code: "GB",
    name: "United Kingdom",
    currencyCode: "GBP",
    currencyName: "British Pound",
    currencySymbol: "£",
    dateFormat: "dd/MM/yyyy",
    numberLocale: "en-GB",
    phoneCode: "+44",
    procurementTerminology: {
      solicitation: "Solicitation",
      bid: "Bid",
      vendor: "Vendor",
      organization: "Organization",
      award: "Award",
      contract: "Contract",
    },
  },

  CA: {
    code: "CA",
    name: "Canada",
    currencyCode: "CAD",
    currencyName: "Canadian Dollar",
    currencySymbol: "C$",
    dateFormat: "yyyy-MM-dd",
    numberLocale: "en-CA",
    phoneCode: "+1",
    procurementTerminology: {
      solicitation: "Solicitation",
      bid: "Bid",
      vendor: "Vendor",
      organization: "Organization",
      award: "Award",
      contract: "Contract",
    },
  },

  AU: {
    code: "AU",
    name: "Australia",
    currencyCode: "AUD",
    currencyName: "Australian Dollar",
    currencySymbol: "A$",
    dateFormat: "dd/MM/yyyy",
    numberLocale: "en-AU",
    phoneCode: "+61",
    procurementTerminology: {
      solicitation: "Solicitation",
      bid: "Bid",
      vendor: "Vendor",
      organization: "Organization",
      award: "Award",
      contract: "Contract",
    },
  },

  DE: {
    code: "DE",
    name: "Germany",
    currencyCode: "EUR",
    currencyName: "Euro",
    currencySymbol: "€",
    dateFormat: "dd.MM.yyyy",
    numberLocale: "de-DE",
    phoneCode: "+49",
    procurementTerminology: {
      solicitation: "Solicitation",
      bid: "Bid",
      vendor: "Vendor",
      organization: "Organization",
      award: "Award",
      contract: "Contract",
    },
  },

  FR: {
    code: "FR",
    name: "France",
    currencyCode: "EUR",
    currencyName: "Euro",
    currencySymbol: "€",
    dateFormat: "dd/MM/yyyy",
    numberLocale: "fr-FR",
    phoneCode: "+33",
    procurementTerminology: {
      solicitation: "Solicitation",
      bid: "Bid",
      vendor: "Vendor",
      organization: "Organization",
      award: "Award",
      contract: "Contract",
    },
  },

  KE: {
    code: "KE",
    name: "Kenya",
    currencyCode: "KES",
    currencyName: "Kenyan Shilling",
    currencySymbol: "KSh",
    dateFormat: "dd/MM/yyyy",
    numberLocale: "en-KE",
    phoneCode: "+254",
    procurementTerminology: {
      solicitation: "Solicitation",
      bid: "Bid",
      vendor: "Vendor",
      organization: "Organization",
      award: "Award",
      contract: "Contract",
    },
  },

  TZ: {
    code: "TZ",
    name: "Tanzania",
    currencyCode: "TZS",
    currencyName: "Tanzanian Shilling",
    currencySymbol: "TSh",
    dateFormat: "dd/MM/yyyy",
    numberLocale: "sw-TZ",
    phoneCode: "+255",
    procurementTerminology: {
      solicitation: "Solicitation",
      bid: "Bid",
      vendor: "Vendor",
      organization: "Organization",
      award: "Award",
      contract: "Contract",
    },
  },

  RW: {
    code: "RW",
    name: "Rwanda",
    currencyCode: "RWF",
    currencyName: "Rwandan Franc",
    currencySymbol: "FRw",
    dateFormat: "dd/MM/yyyy",
    numberLocale: "rw-RW",
    phoneCode: "+250",
    procurementTerminology: {
      solicitation: "Solicitation",
      bid: "Bid",
      vendor: "Vendor",
      organization: "Organization",
      award: "Award",
      contract: "Contract",
    },
  },
};

export function getCountryConfig(
  countryCode: string,
): CountryConfig {
  const normalizedCode = countryCode.trim().toUpperCase();

  return (
    COUNTRY_CONFIGS[normalizedCode] ??
    COUNTRY_CONFIGS[DEFAULT_COUNTRY_CODE]
  );
}

export function countryConfigExists(
  countryCode: string,
): boolean {
  const normalizedCode = countryCode.trim().toUpperCase();

  return Boolean(COUNTRY_CONFIGS[normalizedCode]);
}

export function getCountryCodes(): string[] {
  return Object.keys(COUNTRY_CONFIGS);
}

export function getCountryConfigs(): CountryConfig[] {
  return Object.values(COUNTRY_CONFIGS);
}

export function getCountryName(countryCode: string): string {
  return getCountryConfig(countryCode).name;
}

export function getCountryCurrencyCode(
  countryCode: string,
): string {
  return getCountryConfig(countryCode).currencyCode;
}

export function getCountryCurrencySymbol(
  countryCode: string,
): string {
  return getCountryConfig(countryCode).currencySymbol;
}

export function getCountryLocale(countryCode: string): string {
  return getCountryConfig(countryCode).numberLocale;
}

export function getCountryPhoneCode(countryCode: string): string {
  return getCountryConfig(countryCode).phoneCode;
}