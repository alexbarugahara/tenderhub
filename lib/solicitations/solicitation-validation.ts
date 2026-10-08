import {
  ProcurementMethod,
  SolicitationStatus,
  SolicitationType,
} from "@prisma/client";

export interface SolicitationValidationInput {
  procurementId?: string | null;
  organizationId?: string | null;
  currencyId?: string | null;
  solicitationNumber?: string | null;
  title?: string | null;
  description?: string | null;
  status?: SolicitationStatus | null;
  type?: SolicitationType | null;
  procurementMethod?: ProcurementMethod | null;
  publishedAt?: Date | null;
  openingDate?: Date | null;
  closingDate?: Date | null;
  estimatedValue?: number | null;
  bidSecurityRequired?: boolean | null;
  bidSecurityAmount?: number | null;
  applicationFeeRequired?: boolean | null;
  applicationFeeAmount?: number | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isBlank(
  value: string | null | undefined,
): boolean {
  return !value || value.trim().length === 0;
}

function isValidDate(
  value: Date | null | undefined,
): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  return (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  );
}

function isValidNonNegativeAmount(
  value: number | null | undefined,
): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  return Number.isFinite(value) && value >= 0;
}

export function validateSolicitation(
  input: SolicitationValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(input.procurementId)) {
    errors.push("Procurement is required.");
  }

  if (isBlank(input.organizationId)) {
    errors.push("Organization is required.");
  }

  if (isBlank(input.currencyId)) {
    errors.push("Currency is required.");
  }

  const numberError = validateSolicitationNumber(
    input.solicitationNumber,
  );

  if (numberError) {
    errors.push(numberError);
  }

  const titleError = validateSolicitationTitle(
    input.title,
  );

  if (titleError) {
    errors.push(titleError);
  }

  const descriptionError =
    validateSolicitationDescription(
      input.description,
    );

  if (descriptionError) {
    errors.push(descriptionError);
  }

  const statusError = validateSolicitationStatus(
    input.status,
  );

  if (statusError) {
    errors.push(statusError);
  }

  const typeError = validateSolicitationType(
    input.type,
  );

  if (typeError) {
    errors.push(typeError);
  }

  const methodError =
    validateSolicitationProcurementMethod(
      input.procurementMethod,
    );

  if (methodError) {
    errors.push(methodError);
  }

  const dateErrors = validateSolicitationDates(
    input.publishedAt,
    input.openingDate,
    input.closingDate,
  );

  errors.push(...dateErrors);

  const estimatedValueError =
    validateSolicitationAmount(
      input.estimatedValue,
      "Estimated value",
    );

  if (estimatedValueError) {
    errors.push(estimatedValueError);
  }

  const bidSecurityError =
    validateConditionalAmount(
      input.bidSecurityRequired,
      input.bidSecurityAmount,
      "Bid security",
    );

  if (bidSecurityError) {
    errors.push(bidSecurityError);
  }

  const applicationFeeError =
    validateConditionalAmount(
      input.applicationFeeRequired,
      input.applicationFeeAmount,
      "Application fee",
    );

  if (applicationFeeError) {
    errors.push(applicationFeeError);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSolicitationNumber(
  solicitationNumber: string | null | undefined,
): string | null {
  if (
    solicitationNumber === null ||
    solicitationNumber === undefined
  ) {
    return "Solicitation number is required.";
  }

  const value = solicitationNumber.trim();

  if (value.length === 0) {
    return "Solicitation number is required.";
  }

  if (value.length > 100) {
    return "Solicitation number cannot exceed 100 characters.";
  }

  return null;
}

export function validateSolicitationTitle(
  title: string | null | undefined,
): string | null {
  if (title === null || title === undefined) {
    return "Solicitation title is required.";
  }

  const value = title.trim();

  if (value.length === 0) {
    return "Solicitation title is required.";
  }

  if (value.length < 3) {
    return "Solicitation title must be at least 3 characters long.";
  }

  if (value.length > 255) {
    return "Solicitation title cannot exceed 255 characters.";
  }

  return null;
}

export function validateSolicitationDescription(
  description: string | null | undefined,
): string | null {
  if (
    description === null ||
    description === undefined ||
    description.trim().length === 0
  ) {
    return null;
  }

  if (description.trim().length > 10000) {
    return "Solicitation description cannot exceed 10,000 characters.";
  }

  return null;
}

export function validateSolicitationStatus(
  status: SolicitationStatus | null | undefined,
): string | null {
  if (status === null || status === undefined) {
    return null;
  }

  const validStatuses =
    Object.values(SolicitationStatus) as string[];

  if (!validStatuses.includes(status)) {
    return "Invalid solicitation status.";
  }

  return null;
}

export function validateSolicitationType(
  type: SolicitationType | null | undefined,
): string | null {
  if (type === null || type === undefined) {
    return "Solicitation type is required.";
  }

  const validTypes =
    Object.values(SolicitationType) as string[];

  if (!validTypes.includes(type)) {
    return "Invalid solicitation type.";
  }

  return null;
}

export function validateSolicitationProcurementMethod(
  method: ProcurementMethod | null | undefined,
): string | null {
  if (method === null || method === undefined) {
    return "Procurement method is required.";
  }

  const validMethods =
    Object.values(ProcurementMethod) as string[];

  if (!validMethods.includes(method)) {
    return "Invalid procurement method.";
  }

  return null;
}

export function validateSolicitationDates(
  publishedAt: Date | null | undefined,
  openingDate: Date | null | undefined,
  closingDate: Date | null | undefined,
): string[] {
  const errors: string[] = [];

  if (!isValidDate(publishedAt)) {
    errors.push("Published date is invalid.");
  }

  if (!isValidDate(openingDate)) {
    errors.push("Opening date is invalid.");
  }

  if (!isValidDate(closingDate)) {
    errors.push("Closing date is invalid.");
  }

  if (
    openingDate &&
    closingDate &&
    isValidDate(openingDate) &&
    isValidDate(closingDate) &&
    closingDate <= openingDate
  ) {
    errors.push(
      "Closing date must be after the opening date.",
    );
  }

  if (
    publishedAt &&
    openingDate &&
    isValidDate(publishedAt) &&
    isValidDate(openingDate) &&
    openingDate < publishedAt
  ) {
    errors.push(
      "Opening date cannot be earlier than the publication date.",
    );
  }

  return errors;
}

export function validateSolicitationAmount(
  amount: number | null | undefined,
  label = "Amount",
): string | null {
  if (
    amount === null ||
    amount === undefined
  ) {
    return null;
  }

  if (!Number.isFinite(amount)) {
    return `${label} must be a valid number.`;
  }

  if (amount < 0) {
    return `${label} cannot be negative.`;
  }

  return null;
}

export function validateConditionalAmount(
  required: boolean | null | undefined,
  amount: number | null | undefined,
  label: string,
): string | null {
  if (required === true) {
    if (
      amount === null ||
      amount === undefined
    ) {
      return `${label} amount is required when ${label.toLowerCase()} is required.`;
    }

    if (!isValidNonNegativeAmount(amount)) {
      return `${label} amount must be a valid non-negative number.`;
    }
  }

  if (
    amount !== null &&
    amount !== undefined &&
    !isValidNonNegativeAmount(amount)
  ) {
    return `${label} amount must be a valid non-negative number.`;
  }

  return null;
}

export function validateSolicitationForPublication(
  input: SolicitationValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(input.procurementId)) {
    errors.push(
      "Procurement is required before publication.",
    );
  }

  if (isBlank(input.organizationId)) {
    errors.push(
      "Organization is required before publication.",
    );
  }

  if (isBlank(input.currencyId)) {
    errors.push(
      "Currency is required before publication.",
    );
  }

  const numberError =
    validateSolicitationNumber(
      input.solicitationNumber,
    );

  if (numberError) {
    errors.push(numberError);
  }

  const titleError = validateSolicitationTitle(
    input.title,
  );

  if (titleError) {
    errors.push(titleError);
  }

  const descriptionError =
    validateSolicitationDescription(
      input.description,
    );

  if (descriptionError) {
    errors.push(descriptionError);
  }

  const typeError = validateSolicitationType(
    input.type,
  );

  if (typeError) {
    errors.push(typeError);
  }

  const methodError =
    validateSolicitationProcurementMethod(
      input.procurementMethod,
    );

  if (methodError) {
    errors.push(methodError);
  }

  if (!input.openingDate) {
    errors.push(
      "Opening date is required before publication.",
    );
  }

  if (!input.closingDate) {
    errors.push(
      "Closing date is required before publication.",
    );
  }

  errors.push(
    ...validateSolicitationDates(
      input.publishedAt,
      input.openingDate,
      input.closingDate,
    ),
  );

  if (
    input.bidSecurityRequired === true &&
    (input.bidSecurityAmount === null ||
      input.bidSecurityAmount === undefined)
  ) {
    errors.push(
      "Bid security amount is required when bid security is enabled.",
    );
  }

  if (
    input.applicationFeeRequired === true &&
    (input.applicationFeeAmount === null ||
      input.applicationFeeAmount === undefined)
  ) {
    errors.push(
      "Application fee amount is required when an application fee is enabled.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidSolicitation(
  input: SolicitationValidationInput,
): void {
  const result = validateSolicitation(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidSolicitationForPublication(
  input: SolicitationValidationInput,
): void {
  const result =
    validateSolicitationForPublication(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function isValidSolicitation(
  input: SolicitationValidationInput,
): boolean {
  return validateSolicitation(input).valid;
}
