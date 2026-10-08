import { ClassificationType } from "@prisma/client";

export interface NaicsClassification {
  code: string;
  title: string;
  description?: string;
  sector?: string;
  subsector?: string;
  industryGroup?: string;
  naicsIndustry?: string;
}

export const NAICS_CLASSIFICATION_TYPE = ClassificationType.NAICS;

export const NAICS_SECTORS = [
  { code: "11", title: "Agriculture, Forestry, Fishing and Hunting" },
  { code: "21", title: "Mining, Quarrying, and Oil and Gas Extraction" },
  { code: "22", title: "Utilities" },
  { code: "23", title: "Construction" },
  {
    code: "31-33",
    title: "Manufacturing",
  },
  {
    code: "42",
    title: "Wholesale Trade",
  },
  {
    code: "44-45",
    title: "Retail Trade",
  },
  {
    code: "48-49",
    title: "Transportation and Warehousing",
  },
  {
    code: "51",
    title: "Information",
  },
  {
    code: "52",
    title: "Finance and Insurance",
  },
  {
    code: "53",
    title: "Real Estate and Rental and Leasing",
  },
  {
    code: "54",
    title: "Professional, Scientific, and Technical Services",
  },
  {
    code: "55",
    title: "Management of Companies and Enterprises",
  },
  {
    code: "56",
    title: "Administrative and Support and Waste Management and Remediation Services",
  },
  {
    code: "61",
    title: "Educational Services",
  },
  {
    code: "62",
    title: "Health Care and Social Assistance",
  },
  {
    code: "71",
    title: "Arts, Entertainment, and Recreation",
  },
  {
    code: "72",
    title: "Accommodation and Food Services",
  },
  {
    code: "81",
    title: "Other Services (except Public Administration)",
  },
  {
    code: "92",
    title: "Public Administration",
  },
] as const;

export function normalizeNaicsCode(code: string): string {
  return code.trim().replace(/\s+/g, "");
}

export function isValidNaicsCode(code: string): boolean {
  const normalized = normalizeNaicsCode(code);

  return /^\d{2,6}$/.test(normalized);
}

export function getNaicsCodeLevel(code: string): number | null {
  const normalized = normalizeNaicsCode(code);

  if (!isValidNaicsCode(normalized)) {
    return null;
  }

  return normalized.length;
}

export function isNaicsSector(code: string): boolean {
  const normalized = normalizeNaicsCode(code);

  return NAICS_SECTORS.some((sector) => sector.code === normalized);
}

export function getNaicsSector(
  code: string,
): (typeof NAICS_SECTORS)[number] | undefined {
  const normalized = normalizeNaicsCode(code);

  return NAICS_SECTORS.find(
    (sector) => sector.code === normalized,
  );
}

export function getNaicsParentCode(
  code: string,
): string | null {
  const normalized = normalizeNaicsCode(code);

  if (!isValidNaicsCode(normalized) || normalized.length <= 2) {
    return null;
  }

  return normalized.slice(0, normalized.length - 1);
}

export function isNaicsChildOf(
  code: string,
  parentCode: string,
): boolean {
  const child = normalizeNaicsCode(code);
  const parent = normalizeNaicsCode(parentCode);

  if (
    !isValidNaicsCode(child) ||
    !isValidNaicsCode(parent)
  ) {
    return false;
  }

  return child.startsWith(parent) && child.length > parent.length;
}

export function formatNaicsCode(code: string): string {
  const normalized = normalizeNaicsCode(code);

  if (!isValidNaicsCode(normalized)) {
    return normalized;
  }

  return normalized;
}

export function createNaicsClassification(
  code: string,
  title: string,
  description?: string,
): NaicsClassification {
  const normalizedCode = normalizeNaicsCode(code);

  if (!isValidNaicsCode(normalizedCode)) {
    throw new Error(`Invalid NAICS code: ${code}`);
  }

  return {
    code: normalizedCode,
    title: title.trim(),
    description: description?.trim() || undefined,
  };
}

export function getNaicsClassificationType(): ClassificationType {
  return NAICS_CLASSIFICATION_TYPE;
}