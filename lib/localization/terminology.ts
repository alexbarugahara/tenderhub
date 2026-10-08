export type ProcurementTerminology = {
  solicitation: string;
  solicitations: string;
  bid: string;
  bids: string;
  vendor: string;
  vendors: string;
  organization: string;
  organizations: string;
  procurement: string;
  procurements: string;
  evaluation: string;
  evaluations: string;
  award: string;
  awards: string;
  contract: string;
  contracts: string;
  requirement: string;
  requirements: string;
  lot: string;
  lots: string;
};

export const DEFAULT_TERMINOLOGY: ProcurementTerminology = {
  solicitation: "Solicitation",
  solicitations: "Solicitations",
  bid: "Bid",
  bids: "Bids",
  vendor: "Vendor",
  vendors: "Vendors",
  organization: "Organization",
  organizations: "Organizations",
  procurement: "Procurement",
  procurements: "Procurements",
  evaluation: "Evaluation",
  evaluations: "Evaluations",
  award: "Award",
  awards: "Awards",
  contract: "Contract",
  contracts: "Contracts",
  requirement: "Requirement",
  requirements: "Requirements",
  lot: "Lot",
  lots: "Lots",
};

const COUNTRY_TERMINOLOGY: Record<
  string,
  Partial<ProcurementTerminology>
> = {
  UG: {
    solicitation: "Solicitation",
    solicitations: "Solicitations",
    bid: "Bid",
    bids: "Bids",
    vendor: "Vendor",
    vendors: "Vendors",
    organization: "Organization",
    organizations: "Organizations",
  },

  US: {
    solicitation: "Solicitation",
    solicitations: "Solicitations",
    bid: "Bid",
    bids: "Bids",
    vendor: "Vendor",
    vendors: "Vendors",
    organization: "Organization",
    organizations: "Organizations",
  },

  GB: {
    solicitation: "Solicitation",
    solicitations: "Solicitations",
    bid: "Bid",
    bids: "Bids",
    vendor: "Vendor",
    vendors: "Vendors",
    organization: "Organization",
    organizations: "Organizations",
  },

  CA: {
    solicitation: "Solicitation",
    solicitations: "Solicitations",
    bid: "Bid",
    bids: "Bids",
    vendor: "Vendor",
    vendors: "Vendors",
    organization: "Organization",
    organizations: "Organizations",
  },

  AU: {
    solicitation: "Solicitation",
    solicitations: "Solicitations",
    bid: "Bid",
    bids: "Bids",
    vendor: "Vendor",
    vendors: "Vendors",
    organization: "Organization",
    organizations: "Organizations",
  },
};

export function getTerminology(
  countryCode?: string,
): ProcurementTerminology {
  const normalizedCode =
    countryCode?.trim().toUpperCase();

  return {
    ...DEFAULT_TERMINOLOGY,
    ...(normalizedCode
      ? COUNTRY_TERMINOLOGY[normalizedCode]
      : {}),
  };
}

export function getTerm(
  term: keyof ProcurementTerminology,
  countryCode?: string,
): string {
  return getTerminology(countryCode)[term];
}

export function getSolicitationTerm(
  countryCode?: string,
): string {
  return getTerm("solicitation", countryCode);
}

export function getSolicitationsTerm(
  countryCode?: string,
): string {
  return getTerm("solicitations", countryCode);
}

export function getBidTerm(
  countryCode?: string,
): string {
  return getTerm("bid", countryCode);
}

export function getBidsTerm(
  countryCode?: string,
): string {
  return getTerm("bids", countryCode);
}

export function getVendorTerm(
  countryCode?: string,
): string {
  return getTerm("vendor", countryCode);
}

export function getVendorsTerm(
  countryCode?: string,
): string {
  return getTerm("vendors", countryCode);
}

export function getOrganizationTerm(
  countryCode?: string,
): string {
  return getTerm("organization", countryCode);
}

export function getOrganizationsTerm(
  countryCode?: string,
): string {
  return getTerm("organizations", countryCode);
}

export function getProcurementTerm(
  countryCode?: string,
): string {
  return getTerm("procurement", countryCode);
}

export function getProcurementsTerm(
  countryCode?: string,
): string {
  return getTerm("procurements", countryCode);
}

export function getEvaluationTerm(
  countryCode?: string,
): string {
  return getTerm("evaluation", countryCode);
}

export function getEvaluationsTerm(
  countryCode?: string,
): string {
  return getTerm("evaluations", countryCode);
}

export function getAwardTerm(
  countryCode?: string,
): string {
  return getTerm("award", countryCode);
}

export function getAwardsTerm(
  countryCode?: string,
): string {
  return getTerm("awards", countryCode);
}

export function getContractTerm(
  countryCode?: string,
): string {
  return getTerm("contract", countryCode);
}

export function getContractsTerm(
  countryCode?: string,
): string {
  return getTerm("contracts", countryCode);
}

export function getRequirementTerm(
  countryCode?: string,
): string {
  return getTerm("requirement", countryCode);
}

export function getRequirementsTerm(
  countryCode?: string,
): string {
  return getTerm("requirements", countryCode);
}

export function getLotTerm(
  countryCode?: string,
): string {
  return getTerm("lot", countryCode);
}

export function getLotsTerm(
  countryCode?: string,
): string {
  return getTerm("lots", countryCode);
}