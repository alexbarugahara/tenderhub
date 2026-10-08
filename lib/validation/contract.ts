export type ContractValidationInput = {
  reference?: unknown;
  awardId?: unknown;
  vendorId?: unknown;
  contractValue?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  notes?: unknown;
};

export type ContractValidationResult = {
  success: boolean;
  errors: Record<string, string>;
  data?: {
    reference: string;
    awardId: string;
    vendorId: string;
    contractValue?: number;
    startDate?: Date;
    endDate?: Date;
    notes?: string;
  };
};

function getRequiredString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getOptionalString(
  value: unknown,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function parseOptionalNumber(
  value: unknown,
): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function parseOptionalDate(
  value: unknown,
): Date | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? undefined
      : value;
  }

  if (typeof value === "string") {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? undefined
      : date;
  }

  return undefined;
}

export function validateContract(
  input: ContractValidationInput,
): ContractValidationResult {
  const errors: Record<string, string> = {};

  const reference = getRequiredString(input.reference);
  const awardId = getRequiredString(input.awardId);
  const vendorId = getRequiredString(input.vendorId);

  const contractValue = parseOptionalNumber(
    input.contractValue,
  );

  const startDate = parseOptionalDate(input.startDate);
  const endDate = parseOptionalDate(input.endDate);

  const notes = getOptionalString(input.notes);

  if (!reference) {
    errors.reference =
      "Contract reference is required.";
  } else if (reference.length < 2) {
    errors.reference =
      "Contract reference must be at least 2 characters.";
  } else if (reference.length > 100) {
    errors.reference =
      "Contract reference must not exceed 100 characters.";
  }

  if (!awardId) {
    errors.awardId = "Award is required.";
  }

  if (!vendorId) {
    errors.vendorId = "Vendor is required.";
  }

  if (
    input.contractValue !== undefined &&
    input.contractValue !== null &&
    input.contractValue !== "" &&
    contractValue === undefined
  ) {
    errors.contractValue =
      "Contract value must be a valid number.";
  } else if (
    contractValue !== undefined &&
    contractValue < 0
  ) {
    errors.contractValue =
      "Contract value cannot be negative.";
  }

  if (
    input.startDate !== undefined &&
    input.startDate !== null &&
    input.startDate !== "" &&
    !startDate
  ) {
    errors.startDate =
      "Start date must be a valid date.";
  }

  if (
    input.endDate !== undefined &&
    input.endDate !== null &&
    input.endDate !== "" &&
    !endDate
  ) {
    errors.endDate =
      "End date must be a valid date.";
  }

  if (
    startDate &&
    endDate &&
    endDate <= startDate
  ) {
    errors.endDate =
      "End date must be after the start date.";
  }

  if (notes && notes.length > 5000) {
    errors.notes =
      "Notes must not exceed 5,000 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
    };
  }

  return {
    success: true,
    errors: {},
    data: {
      reference,
      awardId,
      vendorId,
      ...(contractValue !== undefined
        ? { contractValue }
        : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(notes ? { notes } : {}),
    },
  };
}

export function isValidContractReference(
  reference: unknown,
): boolean {
  return validateContract({ reference }).success;
}