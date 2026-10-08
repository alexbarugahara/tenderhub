export const COMPANY_TYPE_CODES: Record<string, string> = {
  PRIVATE_COMPANY: "PC-001",
  PUBLIC_COMPANY: "PU-001",
  GOVERNMENT_ENTITY: "GE-001",
  NGO: "NG-001",
  INTERNATIONAL_NGO: "ING-001",
  PARTNERSHIP: "PT-001",
  SOLE_PROPRIETOR: "SP-001",
  COOPERATIVE: "CO-001",
};

export const INDUSTRY_CODES: Record<string, string> = {
  ICT: "ICT-001",
  CONSTRUCTION: "CON-001",
  PROFESSIONAL_SERVICES: "PRO-001",
  FINANCIAL_SERVICES: "FIN-001",
  HEALTHCARE: "HCR-001",
  GENERAL_SUPPLIES: "SUP-001",
  MANUFACTURING: "MFG-001",
  TRANSPORT_LOGISTICS: "TRL-001",
  AGRICULTURE: "AGR-001",
  ENERGY: "ENG-001",
};

export function getCompanyTypeCode(code: string): string {
  return COMPANY_TYPE_CODES[code] ?? code;
}

export function getIndustryCode(code: string): string {
  return INDUSTRY_CODES[code] ?? code;
}

export function generateRequirementSetCode(
  companyTypeCode: string,
  industryCode: string,
): string {
  const companyCode = getCompanyTypeCode(companyTypeCode);
  const industryCodeValue = getIndustryCode(industryCode);

  return `${companyCode}-${industryCodeValue}`;
}

export function generateRequirementSetName(
  companyTypeName: string,
  industryName: string,
): string {
  return `${industryName} ${companyTypeName} Vendor Compliance`;
}

export function generateRequirementSetDescription(
  companyTypeName: string,
  industryName: string,
): string {
  return `Standard TenderHub compliance requirements for ${companyTypeName.toLowerCase()}s operating in the ${industryName.toLowerCase()} sector.`;
}

