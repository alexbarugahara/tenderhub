export const UNITED_STATES_COUNTRY_CODE = "US";

export const UNITED_STATES_NAME = "United States";

export const UNITED_STATES_CURRENCY_CODE = "USD";

export const UNITED_STATES_CURRENCY_NAME = "US Dollar";

export const UNITED_STATES_CURRENCY_SYMBOL = "$";

export const UNITED_STATES_LOCALE = "en-US";

export const UNITED_STATES_PHONE_CODE = "+1";

export const UNITED_STATES_DATE_FORMAT = "MM/dd/yyyy";

export const UNITED_STATES_TIME_ZONE = "America/New_York";

export const UNITED_STATES_PROCUREMENT_TERMINOLOGY = {
  solicitation: "Solicitation",
  bid: "Bid",
  vendor: "Vendor",
  organization: "Organization",
  award: "Award",
  contract: "Contract",
} as const;

export const UNITED_STATES_PROCUREMENT_METHODS = {
  OPEN: "Open",
  RESTRICTED: "Restricted",
  RFQ: "Request for Quotation",
  DIRECT: "Direct Procurement",
  NEGOTIATED: "Negotiated",
} as const;

export const UNITED_STATES_SOLICITATION_TYPES = {
  RFI: "Request for Information",
  RFQ: "Request for Quotation",
  RFP: "Request for Proposal",
  IFB: "Invitation for Bid",
  ITB: "Invitation to Bid",
  EOI: "Expression of Interest",
  ITT: "Invitation to Tender",
  OTHER: "Other",
} as const;

export const UNITED_STATES_CLASSIFICATION_SYSTEMS = {
  NAICS: "North American Industry Classification System",
  PSC: "Product and Service Codes",
} as const;

export const UNITED_STATES_DEFAULTS = {
  countryCode: UNITED_STATES_COUNTRY_CODE,
  currencyCode: UNITED_STATES_CURRENCY_CODE,
  locale: UNITED_STATES_LOCALE,
  phoneCode: UNITED_STATES_PHONE_CODE,
  dateFormat: UNITED_STATES_DATE_FORMAT,
  timeZone: UNITED_STATES_TIME_ZONE,
} as const;

export function getUnitedStatesConfig() {
  return {
    code: UNITED_STATES_COUNTRY_CODE,
    name: UNITED_STATES_NAME,
    currencyCode: UNITED_STATES_CURRENCY_CODE,
    currencyName: UNITED_STATES_CURRENCY_NAME,
    currencySymbol: UNITED_STATES_CURRENCY_SYMBOL,
    locale: UNITED_STATES_LOCALE,
    phoneCode: UNITED_STATES_PHONE_CODE,
    dateFormat: UNITED_STATES_DATE_FORMAT,
    timeZone: UNITED_STATES_TIME_ZONE,
    procurementTerminology: UNITED_STATES_PROCUREMENT_TERMINOLOGY,
    procurementMethods: UNITED_STATES_PROCUREMENT_METHODS,
    solicitationTypes: UNITED_STATES_SOLICITATION_TYPES,
    classificationSystems: UNITED_STATES_CLASSIFICATION_SYSTEMS,
  };
}

export function isUnitedStatesCountry(
  countryCode: string,
): boolean {
  return (
    countryCode.trim().toUpperCase() ===
    UNITED_STATES_COUNTRY_CODE
  );
}
