export type ProcurementValidationInput = {
  title?: unknown;
  description?: unknown;
  procurementMethod?: unknown;
  categoryId?: unknown;
  estimatedValue?: unknown;
  currencyId?: unknown;
};

export type ProcurementValidationResult = {
  success: boolean;
  errors: Record<string, string>;
  data?: {
    title: string;
    description?: string;
    procurementMethod?: string;
    categoryId?: string;
    estimatedValue?: number;
    currencyId?: string;
  };
};

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

export function validateProcurement(
  input: ProcurementValidationInput,
): ProcurementValidationResult {
  const errors: Record<string, string> = {};

  const title =
    typeof input.title === "string"
      ? input.title.trim()
      : "";

  const description = getOptionalString(
    input.description,
  );

  const procurementMethod = getOptionalString(
    input.procurementMethod,
  );

  const categoryId = getOptionalString(
    input.categoryId,
  );

  const currencyId = getOptionalString(
    input.currencyId,
  );

  const estimatedValue = parseOptionalNumber(
    input.estimatedValue,
  );

  if (!title) {
    errors.title = "Procurement title is required.";
  } else if (title.length < 3) {
    errors.title =
      "Procurement title must be at least 3 characters.";
  } else if (title.length > 300) {
    errors.title =
      "Procurement title must not exceed 300 characters.";
  }

  if (description && description.length > 5000) {
    errors.description =
      "Description must not exceed 5,000 characters.";
  }

  if (
    procurementMethod &&
    procurementMethod.length > 100
  ) {
    errors.procurementMethod =
      "Procurement method must not exceed 100 characters.";
  }

  if (categoryId && categoryId.length > 100) {
    errors.categoryId =
      "Category ID must not exceed 100 characters.";
  }

  if (currencyId && currencyId.length > 100) {
    errors.currencyId =
      "Currency ID must not exceed 100 characters.";
  }

  if (
    input.estimatedValue !== undefined &&
    input.estimatedValue !== null &&
    input.estimatedValue !== "" &&
    estimatedValue === undefined
  ) {
    errors.estimatedValue =
      "Estimated value must be a valid number.";
  } else if (
    estimatedValue !== undefined &&
    estimatedValue < 0
  ) {
    errors.estimatedValue =
      "Estimated value cannot be negative.";
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
      title,
      ...(description ? { description } : {}),
      ...(procurementMethod
        ? { procurementMethod }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(estimatedValue !== undefined
        ? { estimatedValue }
        : {}),
      ...(currencyId ? { currencyId } : {}),
    },
  };
}

export function isValidProcurementTitle(
  title: unknown,
): boolean {
  return validateProcurement({ title }).success;
}