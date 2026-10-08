export type ProcurementMethodConfig = {
  value: string;
  label: string;
  description: string;
};

export const procurementMethods: ProcurementMethodConfig[] = [
  {
    value: "OPEN",
    label: "Open",
    description:
      "Open to eligible vendors who meet the solicitation requirements.",
  },
  {
    value: "RESTRICTED",
    label: "Restricted",
    description:
      "Limited to vendors who meet predefined qualification requirements.",
  },
  {
    value: "RFQ",
    label: "Request for Quotation",
    description:
      "Used to obtain quotations from vendors for defined goods or services.",
  },
  {
    value: "DIRECT",
    label: "Direct",
    description:
      "Direct procurement from a selected vendor where permitted.",
  },
];

export const defaultProcurementMethod = "OPEN";

export function getProcurementMethod(
  value: string | undefined | null,
): ProcurementMethodConfig | undefined {
  if (!value) return undefined;

  return procurementMethods.find(
    (method) =>
      method.value.toUpperCase() === value.trim().toUpperCase(),
  );
}

export function isValidProcurementMethod(
  value: string | undefined | null,
): boolean {
  return Boolean(getProcurementMethod(value));
}

export function getProcurementMethodLabel(
  value: string | undefined | null,
): string {
  return getProcurementMethod(value)?.label ?? value ?? "";
}

