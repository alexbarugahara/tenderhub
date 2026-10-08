import type {
  CheckStatus,
  DocumentStatus,
  VerificationStatus,
} from "./types";

export function formatDate(
  value?: string | Date | null,
  includeTime = false,
): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(includeTime
      ? {
          hour: "numeric",
          minute: "2-digit",
        }
      : {}),
  }).format(date);
}

export function formatFileSize(value?: number | null): string {
  if (value === null || value === undefined || value < 0) {
    return "—";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatCategory(value?: string | null): string {
  if (!value) {
    return "—";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatStatus(value?: string | null): string {
  if (!value) {
    return "Unknown";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function verificationStatusClass(
  status: VerificationStatus | string,
): string {
  switch (status) {
    case "APPROVED":
      return "border-green-200 bg-green-50 text-green-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";

    case "UNDER_REVIEW":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "SUBMITTED":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";

    case "NEEDS_INFORMATION":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "DRAFT":
      return "border-gray-200 bg-gray-50 text-gray-700";

    case "NOT_SUBMITTED":
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

export function checkStatusClass(
  status: CheckStatus | string,
): string {
  switch (status) {
    case "PASSED":
      return "border-green-200 bg-green-50 text-green-700";

    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";

    case "NEEDS_INFORMATION":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "NOT_APPLICABLE":
      return "border-gray-200 bg-gray-50 text-gray-600";

    case "PENDING":
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

export function documentStatusClass(
  status: DocumentStatus | string,
): string {
  switch (status) {
    case "APPROVED":
      return "border-green-200 bg-green-50 text-green-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";

    case "EXPIRED":
      return "border-orange-200 bg-orange-50 text-orange-700";

    case "PENDING":
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function isCheckPassed(status: CheckStatus | string): boolean {
  return status === "PASSED" || status === "NOT_APPLICABLE";
}

export function isCheckPending(status: CheckStatus | string): boolean {
  return status === "PENDING" || status === "NEEDS_INFORMATION";
}

export function calculateCompletionPercentage(
  totalChecks: number,
  passedChecks: number,
): number {
  if (totalChecks <= 0) {
    return 0;
  }

  return Math.round((passedChecks / totalChecks) * 100);
}

export function calculateVerificationSummary(
  checks: Array<{
    required: boolean;
    status: CheckStatus | string;
  }>,
) {
  const totalChecks = checks.length;

  const requiredChecks = checks.filter(
    (check) => check.required,
  ).length;

  const passedChecks = checks.filter((check) =>
    isCheckPassed(check.status),
  ).length;

  const failedChecks = checks.filter(
    (check) => check.status === "FAILED",
  ).length;

  const pendingChecks = checks.filter((check) =>
    isCheckPending(check.status),
  ).length;

  const completionPercentage = calculateCompletionPercentage(
    totalChecks,
    passedChecks,
  );

  const requiredChecksComplete = checks
    .filter((check) => check.required)
    .every((check) => isCheckPassed(check.status));

  const readyForApproval =
    requiredChecks > 0
      ? requiredChecksComplete && failedChecks === 0
      : failedChecks === 0 && pendingChecks === 0;

  return {
    totalChecks,
    requiredChecks,
    passedChecks,
    failedChecks,
    pendingChecks,
    completionPercentage,
    readyForApproval,
  };
}