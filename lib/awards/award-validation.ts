import { AwardStatus } from "@prisma/client";

export interface AwardValidationInput {
  solicitationId?: string | null;
  bidId?: string | null;
  vendorId?: string | null;
  lotId?: string | null;
  awardedById?: string | null;
  status?: AwardStatus | null;
  awardNumber?: string | null;
  title?: string | null;
  description?: string | null;
  awardedAmount?: number | null;
  awardedAt?: Date | null;
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

export function validateAward(
  input: AwardValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(input.solicitationId)) {
    errors.push("Solicitation is required.");
  }

  if (isBlank(input.bidId)) {
    errors.push("Bid is required.");
  }

  if (isBlank(input.vendorId)) {
    errors.push("Vendor is required.");
  }

  if (isBlank(input.awardedById)) {
    errors.push("Awarding user is required.");
  }

  const awardNumberError =
    validateAwardNumber(input.awardNumber);

  if (awardNumberError) {
    errors.push(awardNumberError);
  }

  const titleError = validateAwardTitle(
    input.title,
  );

  if (titleError) {
    errors.push(titleError);
  }

  const descriptionError =
    validateAwardDescription(
      input.description,
    );

  if (descriptionError) {
    errors.push(descriptionError);
  }

  const statusError = validateAwardStatus(
    input.status,
  );

  if (statusError) {
    errors.push(statusError);
  }

  const amountError = validateAwardedAmount(
    input.awardedAmount,
  );

  if (amountError) {
    errors.push(amountError);
  }

  const dateError = validateAwardedAt(
    input.awardedAt,
  );

  if (dateError) {
    errors.push(dateError);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAwardNumber(
  awardNumber: string | null | undefined,
): string | null {
  if (isBlank(awardNumber)) {
    return "Award number is required.";
  }

  const value = awardNumber!.trim();

  if (value.length > 100) {
    return "Award number cannot exceed 100 characters.";
  }

  return null;
}

export function validateAwardTitle(
  title: string | null | undefined,
): string | null {
  if (
    title === null ||
    title === undefined ||
    title.trim().length === 0
  ) {
    return null;
  }

  const value = title.trim();

  if (value.length > 255) {
    return "Award title cannot exceed 255 characters.";
  }

  return null;
}

export function validateAwardDescription(
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
    return "Award description cannot exceed 10,000 characters.";
  }

  return null;
}

export function validateAwardStatus(
  status: AwardStatus | null | undefined,
): string | null {
  if (status === null || status === undefined) {
    return null;
  }

  if (!Object.values(AwardStatus).includes(status)) {
    return "Invalid award status.";
  }

  return null;
}

export function validateAwardedAmount(
  awardedAmount: number | null | undefined,
): string | null {
  if (
    awardedAmount === null ||
    awardedAmount === undefined
  ) {
    return null;
  }

  if (!Number.isFinite(awardedAmount)) {
    return "Awarded amount must be a valid number.";
  }

  if (!isValidNonNegativeAmount(awardedAmount)) {
    return "Awarded amount cannot be negative.";
  }

  return null;
}

export function validateAwardedAt(
  awardedAt: Date | null | undefined,
): string | null {
  if (!isValidDate(awardedAt)) {
    return "Award date is invalid.";
  }

  return null;
}

export function validateAwardForCreation(
  input: AwardValidationInput,
): ValidationResult {
  return validateAward(input);
}

export function validateAwardForUpdate(
  input: AwardValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (input.solicitationId !== undefined) {
    if (isBlank(input.solicitationId)) {
      errors.push("Solicitation is required.");
    }
  }

  if (input.bidId !== undefined) {
    if (isBlank(input.bidId)) {
      errors.push("Bid is required.");
    }
  }

  if (input.vendorId !== undefined) {
    if (isBlank(input.vendorId)) {
      errors.push("Vendor is required.");
    }
  }

  if (input.lotId !== undefined) {
    if (
      input.lotId !== null &&
      input.lotId.trim().length === 0
    ) {
      errors.push("Lot ID cannot be empty.");
    }
  }

  if (input.awardedById !== undefined) {
    if (isBlank(input.awardedById)) {
      errors.push("Awarding user is required.");
    }
  }

  if (input.status !== undefined) {
    const error = validateAwardStatus(
      input.status,
    );

    if (error) {
      errors.push(error);
    }
  }

  if (input.awardNumber !== undefined) {
    const error = validateAwardNumber(
      input.awardNumber,
    );

    if (error) {
      errors.push(error);
    }
  }

  if (input.title !== undefined) {
    const error = validateAwardTitle(
      input.title,
    );

    if (error) {
      errors.push(error);
    }
  }

  if (input.description !== undefined) {
    const error =
      validateAwardDescription(
        input.description,
      );

    if (error) {
      errors.push(error);
    }
  }

  if (input.awardedAmount !== undefined) {
    const error =
      validateAwardedAmount(
        input.awardedAmount,
      );

    if (error) {
      errors.push(error);
    }
  }

  if (input.awardedAt !== undefined) {
    const error = validateAwardedAt(
      input.awardedAt,
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

export function validateAwardForApproval(
  input: AwardValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(input.solicitationId)) {
    errors.push(
      "Solicitation is required before award approval.",
    );
  }

  if (isBlank(input.bidId)) {
    errors.push(
      "Bid is required before award approval.",
    );
  }

  if (isBlank(input.vendorId)) {
    errors.push(
      "Vendor is required before award approval.",
    );
  }

  if (isBlank(input.awardedById)) {
    errors.push(
      "Awarding user is required before award approval.",
    );
  }

  const awardNumberError =
    validateAwardNumber(input.awardNumber);

  if (awardNumberError) {
    errors.push(awardNumberError);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAwardForAcceptance(
  input: AwardValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (
    input.status !== AwardStatus.APPROVED
  ) {
    errors.push(
      "Only approved awards can be accepted.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAwardForCancellation(
  input: AwardValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (
    input.status === AwardStatus.ACCEPTED ||
    input.status === AwardStatus.CANCELLED
  ) {
    errors.push(
      "Accepted or already cancelled awards cannot be cancelled.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidAward(
  input: AwardValidationInput,
): void {
  const result = validateAward(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidAwardForCreation(
  input: AwardValidationInput,
): void {
  const result =
    validateAwardForCreation(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidAwardForUpdate(
  input: AwardValidationInput,
): void {
  const result =
    validateAwardForUpdate(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidAwardForApproval(
  input: AwardValidationInput,
): void {
  const result =
    validateAwardForApproval(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidAwardForAcceptance(
  input: AwardValidationInput,
): void {
  const result =
    validateAwardForAcceptance(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidAwardForCancellation(
  input: AwardValidationInput,
): void {
  const result =
    validateAwardForCancellation(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function isValidAward(
  input: AwardValidationInput,
): boolean {
  return validateAward(input).valid;
}