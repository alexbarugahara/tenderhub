import {
  ProcurementMethod,
  ProcurementStatus,
} from "@prisma/client";

export interface ProcurementValidationInput {
  organizationId?: string | null;
  departmentId?: string | null;
  countryId?: string | null;
  currencyId?: string | null;
  title?: string | null;
  description?: string | null;
  referenceNumber?: string | null;
  status?: ProcurementStatus | null;
  procurementMethod?: ProcurementMethod | null;
  estimatedValue?: number | null;
  plannedStartDate?: Date | null;
  plannedEndDate?: Date | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

function isValidDate(value: Date | null | undefined): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  return value instanceof Date && !Number.isNaN(value.getTime());
}

function isValidNonNegativeNumber(
  value: number | null | undefined,
): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  return Number.isFinite(value) && value >= 0;
}

export function validateProcurement(
  input: ProcurementValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(input.organizationId)) {
    errors.push("Organization is required.");
  }

  if (isBlank(input.countryId)) {
    errors.push("Country is required.");
  }

  if (isBlank(input.currencyId)) {
    errors.push("Currency is required.");
  }

  if (isBlank(input.title)) {
    errors.push("Procurement title is required.");
  } else if (input.title!.trim().length < 3) {
    errors.push(
      "Procurement title must be at least 3 characters long.",
    );
  }

  if (isBlank(input.referenceNumber)) {
    errors.push("Reference number is required.");
  }

  if (
    input.estimatedValue !== null &&
    input.estimatedValue !== undefined &&
    !isValidNonNegativeNumber(input.estimatedValue)
  ) {
    errors.push(
      "Estimated value must be a valid non-negative number.",
    );
  }

  if (!isValidDate(input.plannedStartDate)) {
    errors.push("Planned start date is invalid.");
  }

  if (!isValidDate(input.plannedEndDate)) {
    errors.push("Planned end date is invalid.");
  }

  if (
    input.plannedStartDate &&
    input.plannedEndDate &&
    isValidDate(input.plannedStartDate) &&
    isValidDate(input.plannedEndDate) &&
    input.plannedEndDate < input.plannedStartDate
  ) {
    errors.push(
      "Planned end date cannot be earlier than the planned start date.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateProcurementTitle(
  title: string | null | undefined,
): string | null {
  if (isBlank(title)) {
    return "Procurement title is required.";
  }

  if (title!.trim().length < 3) {
    return "Procurement title must be at least 3 characters long.";
  }

  if (title!.trim().length > 255) {
    return "Procurement title cannot exceed 255 characters.";
  }

  return null;
}

export function validateProcurementReferenceNumber(
  referenceNumber: string | null | undefined,
): string | null {
  if (isBlank(referenceNumber)) {
    return "Reference number is required.";
  }

  if (referenceNumber!.trim().length > 100) {
    return "Reference number cannot exceed 100 characters.";
  }

  return null;
}

export function validateProcurementEstimatedValue(
  estimatedValue: number | null | undefined,
): string | null {
  if (
    estimatedValue === null ||
    estimatedValue === undefined
  ) {
    return null;
  }

  if (!Number.isFinite(estimatedValue)) {
    return "Estimated value must be a valid number.";
  }

  if (estimatedValue < 0) {
    return "Estimated value cannot be negative.";
  }

  return null;
}

export function validateProcurementDates(
  plannedStartDate: Date | null | undefined,
  plannedEndDate: Date | null | undefined,
): string[] {
  const errors: string[] = [];

  if (!isValidDate(plannedStartDate)) {
    errors.push("Planned start date is invalid.");
  }

  if (!isValidDate(plannedEndDate)) {
    errors.push("Planned end date is invalid.");
  }

  if (
    plannedStartDate &&
    plannedEndDate &&
    isValidDate(plannedStartDate) &&
    isValidDate(plannedEndDate) &&
    plannedEndDate < plannedStartDate
  ) {
    errors.push(
      "Planned end date cannot be earlier than the planned start date.",
    );
  }

  return errors;
}

export function validateProcurementStatus(
  status: ProcurementStatus | null | undefined,
): string | null {
  if (status === null || status === undefined) {
    return null;
  }

  if (
    !Object.values(ProcurementStatus).includes(status)
  ) {
    return "Invalid procurement status.";
  }

  return null;
}

export function validateProcurementMethod(
  method: ProcurementMethod | null | undefined,
): string | null {
  if (method === null || method === undefined) {
    return null;
  }

  if (
    !Object.values(ProcurementMethod).includes(method)
  ) {
    return "Invalid procurement method.";
  }

  return null;
}

export function assertValidProcurement(
  input: ProcurementValidationInput,
): void {
  const result = validateProcurement(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function isValidProcurement(
  input: ProcurementValidationInput,
): boolean {
  return validateProcurement(input).valid;
}