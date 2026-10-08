export type BidValidationInput = {
  reference?: unknown;
  solicitationId?: unknown;
  vendorId?: unknown;
  lotId?: unknown;
  amount?: unknown;
  currencyId?: unknown;
  validityPeriod?: unknown;
  notes?: unknown;
};

export type BidValidationResult = {
  success: boolean;
  errors: Record<string, string>;
  data?: {
    reference: string;
    solicitationId: string;
    vendorId: string;
    lotId: string;
    amount?: number;
    currencyId?: string;
    validityPeriod?: number;
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

export function validateBid(
  input: BidValidationInput,
): BidValidationResult {
  const errors: Record<string, string> = {};

  const reference = getRequiredString(input.reference);
  const solicitationId = getRequiredString(
    input.solicitationId,
  );
  const vendorId = getRequiredString(input.vendorId);
  const lotId = getRequiredString(input.lotId);

  const currencyId = getOptionalString(
    input.currencyId,
  );

  const notes = getOptionalString(input.notes);

  const amount = parseOptionalNumber(input.amount);

  const validityPeriod = parseOptionalNumber(
    input.validityPeriod,
  );

  if (!reference) {
    errors.reference = "Bid reference is required.";
  } else if (reference.length < 2) {
    errors.reference =
      "Bid reference must be at least 2 characters.";
  } else if (reference.length > 100) {
    errors.reference =
      "Bid reference must not exceed 100 characters.";
  }

  if (!solicitationId) {
    errors.solicitationId =
      "Solicitation is required.";
  }

  if (!vendorId) {
    errors.vendorId = "Vendor is required.";
  }

  if (!lotId) {
    errors.lotId = "Lot is required.";
  }

  if (
    input.amount !== undefined &&
    input.amount !== null &&
    input.amount !== "" &&
    amount === undefined
  ) {
    errors.amount = "Bid amount must be a valid number.";
  } else if (amount !== undefined && amount < 0) {
    errors.amount = "Bid amount cannot be negative.";
  }

  if (currencyId && currencyId.length > 100) {
    errors.currencyId =
      "Currency ID must not exceed 100 characters.";
  }

  if (
    input.validityPeriod !== undefined &&
    input.validityPeriod !== null &&
    input.validityPeriod !== "" &&
    validityPeriod === undefined
  ) {
    errors.validityPeriod =
      "Validity period must be a valid number.";
  } else if (
    validityPeriod !== undefined &&
    (!Number.isInteger(validityPeriod) ||
      validityPeriod <= 0)
  ) {
    errors.validityPeriod =
      "Validity period must be a positive whole number.";
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
      solicitationId,
      vendorId,
      lotId,
      ...(amount !== undefined ? { amount } : {}),
      ...(currencyId ? { currencyId } : {}),
      ...(validityPeriod !== undefined
        ? { validityPeriod }
        : {}),
      ...(notes ? { notes } : {}),
    },
  };
}

export function isValidBidReference(
  reference: unknown,
): boolean {
  return validateBid({ reference }).success;
}