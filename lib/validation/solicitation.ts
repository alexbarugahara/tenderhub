export type SolicitationValidationInput = {
  reference?: unknown;
  title?: unknown;
  description?: unknown;
  procurementMethod?: unknown;
  openingDate?: unknown;
  closingDate?: unknown;
  categoryId?: unknown;
};

export type SolicitationValidationResult = {
  success: boolean;
  errors: Record<string, string>;
  data?: {
    reference: string;
    title: string;
    description?: string;
    procurementMethod?: string;
    openingDate?: Date;
    closingDate?: Date;
    categoryId?: string;
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

export function validateSolicitation(
  input: SolicitationValidationInput,
): SolicitationValidationResult {
  const errors: Record<string, string> = {};

  const reference =
    typeof input.reference === "string"
      ? input.reference.trim()
      : "";

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

  const openingDate = parseOptionalDate(
    input.openingDate,
  );

  const closingDate = parseOptionalDate(
    input.closingDate,
  );

  if (!reference) {
    errors.reference =
      "Solicitation reference is required.";
  } else if (reference.length < 2) {
    errors.reference =
      "Solicitation reference must be at least 2 characters.";
  } else if (reference.length > 100) {
    errors.reference =
      "Solicitation reference must not exceed 100 characters.";
  }

  if (!title) {
    errors.title = "Solicitation title is required.";
  } else if (title.length < 3) {
    errors.title =
      "Solicitation title must be at least 3 characters.";
  } else if (title.length > 300) {
    errors.title =
      "Solicitation title must not exceed 300 characters.";
  }

  if (description && description.length > 10000) {
    errors.description =
      "Description must not exceed 10,000 characters.";
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

  if (
    input.openingDate !== undefined &&
    input.openingDate !== null &&
    input.openingDate !== "" &&
    !openingDate
  ) {
    errors.openingDate =
      "Opening date must be a valid date.";
  }

  if (
    input.closingDate !== undefined &&
    input.closingDate !== null &&
    input.closingDate !== "" &&
    !closingDate
  ) {
    errors.closingDate =
      "Closing date must be a valid date.";
  }

  if (
    openingDate &&
    closingDate &&
    closingDate <= openingDate
  ) {
    errors.closingDate =
      "Closing date must be after the opening date.";
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
      title,
      ...(description ? { description } : {}),
      ...(procurementMethod
        ? { procurementMethod }
        : {}),
      ...(openingDate ? { openingDate } : {}),
      ...(closingDate ? { closingDate } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
  };
}

export function isValidSolicitationReference(
  reference: unknown,
): boolean {
  return validateSolicitation({ reference }).success;
}