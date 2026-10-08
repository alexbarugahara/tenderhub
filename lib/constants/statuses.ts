export const USER_STATUSES = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  DELETED: "DELETED",
} as const;

export const PROCUREMENT_STATUSES = {
  DRAFT: "DRAFT",
  PLANNED: "PLANNED",
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  ARCHIVED: "ARCHIVED",
} as const;

export const SOLICITATION_STATUSES = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  OPEN: "OPEN",
  UNDER_EVALUATION: "UNDER_EVALUATION",
  AWARDED: "AWARDED",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
  SUSPENDED: "SUSPENDED",
  ARCHIVED: "ARCHIVED",
} as const;

export const LOT_STATUSES = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  AWARDED: "AWARDED",
  CANCELLED: "CANCELLED",
} as const;

export const BID_STATUSES = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  COMPLIANT: "COMPLIANT",
  NON_COMPLIANT: "NON_COMPLIANT",
  SHORTLISTED: "SHORTLISTED",
  EVALUATED: "EVALUATED",
  WITHDRAWN: "WITHDRAWN",
  REJECTED: "REJECTED",
  AWARDED: "AWARDED",
} as const;

export const EVALUATION_STATUSES = {
  DRAFT: "DRAFT",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  APPROVED: "APPROVED",
} as const;

export const AWARD_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  CANCELLED: "CANCELLED",
} as const;

export const CONTRACT_STATUSES = {
  DRAFT: "DRAFT",
  PENDING_SIGNATURE: "PENDING_SIGNATURE",
  ACTIVE: "ACTIVE",
  ON_HOLD: "ON_HOLD",
  COMPLETED: "COMPLETED",
  TERMINATED: "TERMINATED",
  EXPIRED: "EXPIRED",
} as const;

export const MILESTONE_STATUSES = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  DELAYED: "DELAYED",
  CANCELLED: "CANCELLED",
} as const;

export const CONTRACT_PAYMENT_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export const COMPLIANCE_STATUSES = {
  PENDING: "PENDING",
  COMPLIANT: "COMPLIANT",
  NON_COMPLIANT: "NON_COMPLIANT",
  EXPIRED: "EXPIRED",
  EXPIRING: "EXPIRING",
  NOT_APPLICABLE: "NOT_APPLICABLE",
} as const;

export const DOCUMENT_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
} as const;

export const PAYMENT_STATUSES = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const;

export const SUBSCRIPTION_STATUSES = {
  ACTIVE: "ACTIVE",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  PENDING: "PENDING",
  TRIAL: "TRIAL",
} as const;

export const INTEGRATION_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ERROR: "ERROR",
  SUSPENDED: "SUSPENDED",
} as const;

export const INTEGRATION_SYNC_STATUSES = {
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  PLANNED: "Planned",
  ACTIVE: "Active",
  PUBLISHED: "Published",
  OPEN: "Open",
  UNDER_EVALUATION: "Under Evaluation",
  UNDER_REVIEW: "Under Review",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CLOSED: "Closed",
  AWARDED: "Awarded",
  APPROVED: "Approved",
  ACCEPTED: "Accepted",
  SHORTLISTED: "Shortlisted",
  EVALUATED: "Evaluated",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  WITHDRAWN: "Withdrawn",
  REJECTED: "Rejected",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
  PENDING_SIGNATURE: "Pending Signature",
  ON_HOLD: "On Hold",
  TERMINATED: "Terminated",
  EXPIRED: "Expired",
  DELAYED: "Delayed",
  FAILED: "Failed",
  REFUNDED: "Refunded",
  TRIAL: "Trial",
  ERROR: "Error",
  INACTIVE: "Inactive",
  RUNNING: "Running",
  SUCCESS: "Success",
  EXPIRING: "Expiring",
  NOT_APPLICABLE: "Not Applicable",
};

export function getStatusLabel(
  status: string | undefined | null,
): string {
  if (!status) return "";

  return (
    STATUS_LABELS[status] ??
    status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}