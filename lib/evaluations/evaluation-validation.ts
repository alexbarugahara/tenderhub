import {
  EvaluationStatus,
} from "@prisma/client";

export interface EvaluationValidationInput {
  solicitationId?: string | null;
  bidId?: string | null;
  evaluatorId?: string | null;
  status?: EvaluationStatus | null;
  comments?: string | null;
  totalScore?: number | null;
  completedAt?: Date | null;
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

function isValidNonNegativeScore(
  value: number | null | undefined,
): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  return Number.isFinite(value) && value >= 0;
}

export function validateEvaluation(
  input: EvaluationValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(input.solicitationId)) {
    errors.push("Solicitation is required.");
  }

  if (isBlank(input.bidId)) {
    errors.push("Bid is required.");
  }

  if (isBlank(input.evaluatorId)) {
    errors.push("Evaluator is required.");
  }

  const statusError = validateEvaluationStatus(
    input.status,
  );

  if (statusError) {
    errors.push(statusError);
  }

  const commentsError =
    validateEvaluationComments(
      input.comments,
    );

  if (commentsError) {
    errors.push(commentsError);
  }

  const scoreError =
    validateEvaluationTotalScore(
      input.totalScore,
    );

  if (scoreError) {
    errors.push(scoreError);
  }

  const dateError =
    validateEvaluationCompletedAt(
      input.completedAt,
    );

  if (dateError) {
    errors.push(dateError);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateEvaluationStatus(
  status: EvaluationStatus | null | undefined,
): string | null {
  if (status === null || status === undefined) {
    return null;
  }

  if (
    !Object.values(EvaluationStatus).includes(
      status,
    )
  ) {
    return "Invalid evaluation status.";
  }

  return null;
}

export function validateEvaluationComments(
  comments: string | null | undefined,
): string | null {
  if (
    comments === null ||
    comments === undefined ||
    comments.trim().length === 0
  ) {
    return null;
  }

  if (comments.trim().length > 10000) {
    return "Evaluation comments cannot exceed 10,000 characters.";
  }

  return null;
}

export function validateEvaluationTotalScore(
  totalScore: number | null | undefined,
): string | null {
  if (
    totalScore === null ||
    totalScore === undefined
  ) {
    return null;
  }

  if (!Number.isFinite(totalScore)) {
    return "Evaluation total score must be a valid number.";
  }

  if (!isValidNonNegativeScore(totalScore)) {
    return "Evaluation total score cannot be negative.";
  }

  return null;
}

export function validateEvaluationCompletedAt(
  completedAt: Date | null | undefined,
): string | null {
  if (!isValidDate(completedAt)) {
    return "Evaluation completion date is invalid.";
  }

  return null;
}

export function validateEvaluationForCreation(
  input: EvaluationValidationInput,
): ValidationResult {
  return validateEvaluation(input);
}

export function validateEvaluationForUpdate(
  input: EvaluationValidationInput,
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

  if (input.evaluatorId !== undefined) {
    if (isBlank(input.evaluatorId)) {
      errors.push("Evaluator is required.");
    }
  }

  if (input.status !== undefined) {
    const error = validateEvaluationStatus(
      input.status,
    );

    if (error) {
      errors.push(error);
    }
  }

  if (input.comments !== undefined) {
    const error =
      validateEvaluationComments(
        input.comments,
      );

    if (error) {
      errors.push(error);
    }
  }

  if (input.totalScore !== undefined) {
    const error =
      validateEvaluationTotalScore(
        input.totalScore,
      );

    if (error) {
      errors.push(error);
    }
  }

  if (input.completedAt !== undefined) {
    const error =
      validateEvaluationCompletedAt(
        input.completedAt,
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

export function validateEvaluationForStart(
  input: EvaluationValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(input.solicitationId)) {
    errors.push(
      "Solicitation is required before evaluation can start.",
    );
  }

  if (isBlank(input.bidId)) {
    errors.push(
      "Bid is required before evaluation can start.",
    );
  }

  if (isBlank(input.evaluatorId)) {
    errors.push(
      "Evaluator is required before evaluation can start.",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateEvaluationForCompletion(
  input: EvaluationValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (isBlank(input.solicitationId)) {
    errors.push(
      "Solicitation is required before evaluation can be completed.",
    );
  }

  if (isBlank(input.bidId)) {
    errors.push(
      "Bid is required before evaluation can be completed.",
    );
  }

  if (isBlank(input.evaluatorId)) {
    errors.push(
      "Evaluator is required before evaluation can be completed.",
    );
  }

  if (
    input.totalScore === null ||
    input.totalScore === undefined
  ) {
    errors.push(
      "Total score is required before evaluation can be completed.",
    );
  } else {
    const scoreError =
      validateEvaluationTotalScore(
        input.totalScore,
      );

    if (scoreError) {
      errors.push(scoreError);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateEvaluationForApproval(
  input: EvaluationValidationInput,
): ValidationResult {
  const errors: string[] = [];

  if (
    input.status !==
    EvaluationStatus.COMPLETED
  ) {
    errors.push(
      "Only completed evaluations can be approved.",
    );
  }

  if (
    input.totalScore === null ||
    input.totalScore === undefined
  ) {
    errors.push(
      "Total score is required before evaluation approval.",
    );
  } else {
    const scoreError =
      validateEvaluationTotalScore(
        input.totalScore,
      );

    if (scoreError) {
      errors.push(scoreError);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidEvaluation(
  input: EvaluationValidationInput,
): void {
  const result = validateEvaluation(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidEvaluationForCreation(
  input: EvaluationValidationInput,
): void {
  const result =
    validateEvaluationForCreation(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidEvaluationForUpdate(
  input: EvaluationValidationInput,
): void {
  const result =
    validateEvaluationForUpdate(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidEvaluationForStart(
  input: EvaluationValidationInput,
): void {
  const result =
    validateEvaluationForStart(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidEvaluationForCompletion(
  input: EvaluationValidationInput,
): void {
  const result =
    validateEvaluationForCompletion(
      input,
    );

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function assertValidEvaluationForApproval(
  input: EvaluationValidationInput,
): void {
  const result =
    validateEvaluationForApproval(input);

  if (!result.valid) {
    throw new Error(result.errors.join(" "));
  }
}

export function isValidEvaluation(
  input: EvaluationValidationInput,
): boolean {
  return validateEvaluation(input).valid;
}