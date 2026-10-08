import { LotStatus } from "@prisma/client";

export interface LotValidationInput {
  solicitationId?: string | null;
  lotNumber?: string | null;
  title?: string | null;
  description?: string | null;
  status?: LotStatus | null;
  estimatedValue?: number | null;
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

function isValidNonNegativeAmount(
  value: number | null | undefined,
): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  return Number.isFinite(value) && value >= 0;
}

export function validateLot(
  input: LotValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(input.solicitationId)) {
    errors.push("Solicitation is required.");
  }

  const lotNumberError = validateLotNumber(
    input.lotNumber,
  );

  if (lotNumberError) {
    errors.push(lotNumberError);
  }

  const titleError = validateLotTitle(
    input.title,
  );

  if (titleError) {
    errors.push(titleError);
  }

  const descriptionError =
    validateLotDescription(input.description);

  if (descriptionError) {
    errors.push(descriptionError);
  }

  const statusError = validateLotStatus(
    input.status,
  );

  if (statusError) {
    errors.push(statusError);
  }

  const amountError = validateLotEstimatedValue(
    input.estimatedValue,
  );

  if (amountError) {
    errors.push(amountError);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateLotNumber(
  lotNumber: string | null | undefined,
): string | null {
  if (isBlank(lotNumber)) {
    return "Lot number is required.";
  }

  const value = lotNumber!.trim();

  if (value.length > 100) {
    return "Lot number cannot exceed 100 characters.";
  }

  return null;
}

export function validateLotTitle(
  title: string | null | undefined,
): string | null {
  if (isBlank(title)) {
    return "Lot title is required.";
  }

  const value = title!.trim();

  if (value.length < 2) {
    return "Lot title must be at least 2 characters long.";
  }

  if (value.length > 255) {
    return "Lot title cannot exceed 255 characters.";
  }

  return null;
}

export function validateLotDescription(
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
    return "Lot description cannot exceed 10,000 characters.";
  }

  return null;
}

export function validateLotStatus(
  status: LotStatus | null | undefined,
): string | null {
  if (status === null || status === undefined) {
    return null;
  }

  if (!Object.values(LotStatus).includes(status)) {
    return "Invalid lot status.";
  }

  return null;
}

export function validateLotEstimatedValue(
  estimatedValue: number | null | undefined,
): string | null {
  if (
    estimatedValue === null ||
    estimatedValue === undefined
  ) {
    return null;
  }

  if (!Number.isFinite(estimatedValue)) {
    return "Lot estimated value must be a valid number.";
  }

  if (!isValidNonNegativeAmount(estimatedValue)) {
    return "Lot estimated value cannot be negative.";
  }

  return null;
}

export function validateLotForCreation(
  input: LotValidationInput,
): ValidationResult {
  return validateLot(input);
}

export function validateLotForUpdate(
  input: LotValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (input.solicitationId !== undefined) {
    if (isBlank(input.solicitationId)) {
      errors.push("Solicitation is required.");
    }
  }

  if (input.lotNumber !== undefined) {
    const error = validateLotNumber(input.lotNumber);

    if (error) {
      errors.push(error);
    }
  }

  if (input.title !== undefined) {
    const error = validateLotTitle(input.title);

    if (error) {
      errors.push(error);
    }
  }

  if (input.description !== undefined) {
    const error = validateLotDescription(
      input.description,
    );

    if (error) {
      errors.push(error);
    }
  }

  if (input.status !== undefined) {
    const error = validateLotStatus(input.status);

    if (error) {
      errors.push(error);
    }
  }

  if (input.estimatedValue !== undefined) {
    const error = validateLotEstimatedValue(
      input.estimatedValue,
    );

    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidLot(
  input: LotValidationInput,
): void {
  const result = validateLot(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidLotForUpdate(
  input: LotValidationInput,
): void {
  const result = validateLotForUpdate(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function isValidLot(
  input: LotValidationInput,
): boolean {
  return validateLot(input).valid;
}