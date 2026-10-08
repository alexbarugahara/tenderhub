import { BidStatus } from "@prisma/client";

export interface BidValidationInput {
  solicitationId?: string | null;
  lotId?: string | null;
  vendorId?: string | null;
  submittedById?: string | null;
  currencyId?: string | null;
  bidNumber?: string | null;
  status?: BidStatus | null;
  title?: string | null;
  summary?: string | null;
  totalAmount?: number | null;
  submittedAt?: Date | null;
  lockedAt?: Date | null;
  withdrawalReason?: string | null;
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

export function validateBid(
  input: BidValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(input.solicitationId)) {
    errors.push("Solicitation is required.");
  }

  if (isBlank(input.vendorId)) {
    errors.push("Vendor is required.");
  }

  if (isBlank(input.submittedById)) {
    errors.push("Bid submitter is required.");
  }

  if (isBlank(input.currencyId)) {
    errors.push("Currency is required.");
  }

  const bidNumberError = validateBidNumber(
    input.bidNumber,
  );

  if (bidNumberError) {
    errors.push(bidNumberError);
  }

  const titleError = validateBidTitle(input.title);

  if (titleError) {
    errors.push(titleError);
  }

  const summaryError = validateBidSummary(
    input.summary,
  );

  if (summaryError) {
    errors.push(summaryError);
  }

  const statusError = validateBidStatus(
    input.status,
  );

  if (statusError) {
    errors.push(statusError);
  }

  const amountError = validateBidTotalAmount(
    input.totalAmount,
  );

  if (amountError) {
    errors.push(amountError);
  }

  const dateErrors = validateBidDates(
    input.submittedAt,
    input.lockedAt,
  );

  errors.push(...dateErrors);

  const withdrawalError =
    validateBidWithdrawalReason(
      input.status,
      input.withdrawalReason,
    );

  if (withdrawalError) {
    errors.push(withdrawalError);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateBidNumber(
  bidNumber: string | null | undefined,
): string | null {
  if (isBlank(bidNumber)) {
    return "Bid number is required.";
  }

  const value = bidNumber!.trim();

  if (value.length > 100) {
    return "Bid number cannot exceed 100 characters.";
  }

  return null;
}

export function validateBidTitle(
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
    return "Bid title cannot exceed 255 characters.";
  }

  return null;
}

export function validateBidSummary(
  summary: string | null | undefined,
): string | null {
  if (
    summary === null ||
    summary === undefined ||
    summary.trim().length === 0
  ) {
    return null;
  }

  if (summary.trim().length > 10000) {
    return "Bid summary cannot exceed 10,000 characters.";
  }

  return null;
}

export function validateBidStatus(
  status: BidStatus | null | undefined,
): string | null {
  if (status === null || status === undefined) {
    return null;
  }

  if (!Object.values(BidStatus).includes(status)) {
    return "Invalid bid status.";
  }

  return null;
}

export function validateBidTotalAmount(
  totalAmount: number | null | undefined,
): string | null {
  if (
    totalAmount === null ||
    totalAmount === undefined
  ) {
    return null;
  }

  if (!Number.isFinite(totalAmount)) {
    return "Bid total amount must be a valid number.";
  }

  if (!isValidNonNegativeAmount(totalAmount)) {
    return "Bid total amount cannot be negative.";
  }

  return null;
}

export function validateBidDates(
  submittedAt: Date | null | undefined,
  lockedAt: Date | null | undefined,
): string[] {
  const errors: string[] = [];

  if (!isValidDate(submittedAt)) {
    errors.push("Bid submission date is invalid.");
  }

  if (!isValidDate(lockedAt)) {
    errors.push("Bid lock date is invalid.");
  }

  if (
    submittedAt &&
    lockedAt &&
    isValidDate(submittedAt) &&
    isValidDate(lockedAt) &&
    lockedAt < submittedAt
  ) {
    errors.push(
      "Bid lock date cannot be earlier than the submission date.",
    );
  }

  return errors;
}

export function validateBidWithdrawalReason(
  status: BidStatus | null | undefined,
  withdrawalReason: string | null | undefined,
): string | null {
  if (
    withdrawalReason === null ||
    withdrawalReason === undefined ||
    withdrawalReason.trim().length === 0
  ) {
    if (status === BidStatus.WITHDRAWN) {
      return "A withdrawal reason is required when a bid is withdrawn.";
    }

    return null;
  }

  if (withdrawalReason.trim().length > 2000) {
    return "Withdrawal reason cannot exceed 2,000 characters.";
  }

  return null;
}

export function validateBidForCreation(
  input: BidValidationInput,
): ValidationResult {
  return validateBid(input);
}

export function validateBidForUpdate(
  input: BidValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (input.solicitationId !== undefined) {
    if (isBlank(input.solicitationId)) {
      errors.push("Solicitation is required.");
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

  if (input.vendorId !== undefined) {
    if (isBlank(input.vendorId)) {
      errors.push("Vendor is required.");
    }
  }

  if (input.submittedById !== undefined) {
    if (isBlank(input.submittedById)) {
      errors.push("Bid submitter is required.");
    }
  }

  if (input.currencyId !== undefined) {
    if (isBlank(input.currencyId)) {
      errors.push("Currency is required.");
    }
  }

  if (input.bidNumber !== undefined) {
    const error = validateBidNumber(
      input.bidNumber,
    );

    if (error) {
      errors.push(error);
    }
  }

  if (input.title !== undefined) {
    const error = validateBidTitle(input.title);

    if (error) {
      errors.push(error);
    }
  }

  if (input.summary !== undefined) {
    const error = validateBidSummary(
      input.summary,
    );

    if (error) {
      errors.push(error);
    }
  }

  if (input.status !== undefined) {
    const error = validateBidStatus(input.status);

    if (error) {
      errors.push(error);
    }
  }

  if (input.totalAmount !== undefined) {
    const error = validateBidTotalAmount(
      input.totalAmount,
    );

    if (error) {
      errors.push(error);
    }
  }

  if (
    input.submittedAt !== undefined ||
    input.lockedAt !== undefined
  ) {
    errors.push(
      ...validateBidDates(
        input.submittedAt,
        input.lockedAt,
      ),
    );
  }

  if (
    input.status !== undefined ||
    input.withdrawalReason !== undefined
  ) {
    const error =
      validateBidWithdrawalReason(
        input.status,
        input.withdrawalReason,
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

export function validateBidForSubmission(
  input: BidValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(input.solicitationId)) {
    errors.push(
      "Solicitation is required before submission.",
    );
  }

  if (isBlank(input.vendorId)) {
    errors.push(
      "Vendor is required before submission.",
    );
  }

  if (isBlank(input.submittedById)) {
    errors.push(
      "Bid submitter is required before submission.",
    );
  }

  if (isBlank(input.currencyId)) {
    errors.push(
      "Currency is required before submission.",
    );
  }

  const bidNumberError = validateBidNumber(
    input.bidNumber,
  );

  if (bidNumberError) {
    errors.push(bidNumberError);
  }

  const titleError = validateBidTitle(input.title);

  if (titleError) {
    errors.push(titleError);
  }

  const summaryError = validateBidSummary(
    input.summary,
  );

  if (summaryError) {
    errors.push(summaryError);
  }

  if (
    input.totalAmount === null ||
    input.totalAmount === undefined
  ) {
    errors.push(
      "Bid total amount is required before submission.",
    );
  } else {
    const amountError = validateBidTotalAmount(
      input.totalAmount,
    );

    if (amountError) {
      errors.push(amountError);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateBidForWithdrawal(
  withdrawalReason: string | null | undefined,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(withdrawalReason)) {
    errors.push(
      "A withdrawal reason is required.",
    );
  } else if (
    withdrawalReason!.trim().length > 2000
  ) {
    errors.push(
      "Withdrawal reason cannot exceed 2,000 characters.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidBid(
  input: BidValidationInput,
): void {
  const result = validateBid(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidBidForCreation(
  input: BidValidationInput,
): void {
  const result = validateBidForCreation(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidBidForUpdate(
  input: BidValidationInput,
): void {
  const result = validateBidForUpdate(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidBidForSubmission(
  input: BidValidationInput,
): void {
  const result = validateBidForSubmission(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidBidForWithdrawal(
  withdrawalReason: string | null | undefined,
): void {
  const result =
    validateBidForWithdrawal(withdrawalReason);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function isValidBid(
  input: BidValidationInput,
): boolean {
  return validateBid(input).valid;
}