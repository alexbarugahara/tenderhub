import type { SolicitationType } from "@prisma/client";

export interface SolicitationTypeConfig {
  value: SolicitationType;
  label: string;
  shortLabel: string;
  description: string;
}

export const SOLICITATION_TYPES: SolicitationTypeConfig[] = [
  {
    value: "RFP" as SolicitationType,
    label: "Request for Proposals",
    shortLabel: "RFP",
    description:
      "Used to invite detailed technical and financial proposals for complex goods, services, or projects.",
  },
  {
    value: "RFQ" as SolicitationType,
    label: "Request for Quotations",
    shortLabel: "RFQ",
    description:
      "Used to obtain price quotations for clearly defined goods or services.",
  },
  {
    value: "ITB" as SolicitationType,
    label: "Invitation to Bid",
    shortLabel: "ITB",
    description:
      "Used to invite competitive bids against clearly defined procurement requirements.",
  },
  {
    value: "ITT" as SolicitationType,
    label: "Invitation to Tender",
    shortLabel: "ITT",
    description:
      "Used to formally invite vendors to submit tenders against defined requirements.",
  },
  {
    value: "EOI" as SolicitationType,
    label: "Expression of Interest",
    shortLabel: "EOI",
    description:
      "Used to identify organizations or suppliers interested in participating in a procurement opportunity.",
  },
  {
    value: "RFI" as SolicitationType,
    label: "Request for Information",
    shortLabel: "RFI",
    description:
      "Used to gather market information, technical information, or supplier capability information.",
  },
  {
    value: "IFB" as SolicitationType,
    label: "Invitation for Bids",
    shortLabel: "IFB",
    description:
      "Used to invite competitive bids against established procurement requirements.",
  },
  {
    value: "OTHER" as SolicitationType,
    label: "Other",
    shortLabel: "OTHER",
    description:
      "Used for solicitation processes that do not fit the standard solicitation types.",
  },
];

export const SOLICITATION_TYPE_MAP = Object.fromEntries(
  SOLICITATION_TYPES.map((type) => [type.value, type]),
) as Record<SolicitationType, SolicitationTypeConfig>;

export function getSolicitationTypeConfig(
  type: SolicitationType | string | null | undefined,
): SolicitationTypeConfig | undefined {
  if (!type) {
    return undefined;
  }

  return SOLICITATION_TYPE_MAP[type as SolicitationType];
}

export function getSolicitationTypeLabel(
  type: SolicitationType | string | null | undefined,
): string {
  return (
    getSolicitationTypeConfig(type)?.label ??
    type ??
    "Unknown Type"
  );
}

export function getSolicitationTypeShortLabel(
  type: SolicitationType | string | null | undefined,
): string {
  return (
    getSolicitationTypeConfig(type)?.shortLabel ??
    type ??
    "Unknown"
  );
}

export function getSolicitationTypeDescription(
  type: SolicitationType | string | null | undefined,
): string {
  return (
    getSolicitationTypeConfig(type)?.description ??
    "Procurement solicitation."
  );
}