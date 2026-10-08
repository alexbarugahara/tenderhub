import { SolicitationStatus } from "@prisma/client";

export const SOLICITATION_STATUS_LABELS: Record<
  SolicitationStatus,
  string
> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  OPEN: "Open",
  UNDER_EVALUATION: "Under Evaluation",
  AWARDED: "Awarded",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
};

export const SOLICITATION_STATUS_DESCRIPTIONS: Record<
  SolicitationStatus,
  string
> = {
  DRAFT:
    "The solicitation is being prepared and is not publicly available.",
  PUBLISHED:
    "The solicitation has been published and is available to vendors.",
  OPEN:
    "The solicitation is open and accepting bids.",
  UNDER_EVALUATION:
    "The submission period has ended and bids are being evaluated.",
  AWARDED:
    "The solicitation has been awarded.",
  CLOSED:
    "The solicitation process has been closed.",
  CANCELLED:
    "The solicitation has been cancelled.",
  SUSPENDED:
    "The solicitation has been temporarily suspended.",
  ARCHIVED:
    "The solicitation has been archived for historical reference.",
};

export function getSolicitationStatusLabel(
  status: SolicitationStatus,
): string {
  return SOLICITATION_STATUS_LABELS[status];
}

export function getSolicitationStatusDescription(
  status: SolicitationStatus,
): string {
  return SOLICITATION_STATUS_DESCRIPTIONS[status];
}

export function isSolicitationStatus(
  value: unknown,
): value is SolicitationStatus {
  return Object.values(SolicitationStatus).includes(
    value as SolicitationStatus,
  );
}

export function isSolicitationEditable(
  status: SolicitationStatus,
): boolean {
  return (
    status === SolicitationStatus.DRAFT ||
    status === SolicitationStatus.PUBLISHED ||
    status === SolicitationStatus.SUSPENDED
  );
}

export function isSolicitationTerminal(
  status: SolicitationStatus,
): boolean {
  return (
    status === SolicitationStatus.CLOSED ||
    status === SolicitationStatus.CANCELLED ||
    status === SolicitationStatus.ARCHIVED
  );
}

export function canPublishSolicitation(
  status: SolicitationStatus,
): boolean {
  return status === SolicitationStatus.DRAFT;
}

export function canOpenSolicitation(
  status: SolicitationStatus,
): boolean {
  return (
    status === SolicitationStatus.PUBLISHED ||
    status === SolicitationStatus.SUSPENDED
  );
}

export function canStartEvaluation(
  status: SolicitationStatus,
): boolean {
  return status === SolicitationStatus.OPEN;
}

export function canAwardSolicitation(
  status: SolicitationStatus,
): boolean {
  return (
    status === SolicitationStatus.UNDER_EVALUATION
  );
}

export function canCloseSolicitation(
  status: SolicitationStatus,
): boolean {
  return (
    status === SolicitationStatus.AWARDED ||
    status === SolicitationStatus.UNDER_EVALUATION
  );
}

export function canCancelSolicitation(
  status: SolicitationStatus,
): boolean {
  return (
    status === SolicitationStatus.DRAFT ||
    status === SolicitationStatus.PUBLISHED ||
    status === SolicitationStatus.OPEN ||
    status === SolicitationStatus.SUSPENDED
  );
}

export function canSuspendSolicitation(
  status: SolicitationStatus,
): boolean {
  return (
    status === SolicitationStatus.PUBLISHED ||
    status === SolicitationStatus.OPEN
  );
}

export function canArchiveSolicitation(
  status: SolicitationStatus,
): boolean {
  return (
    status === SolicitationStatus.CLOSED ||
    status === SolicitationStatus.CANCELLED
  );
}

export function getAllowedSolicitationStatusTransitions(
  currentStatus: SolicitationStatus,
): SolicitationStatus[] {
  switch (currentStatus) {
    case SolicitationStatus.DRAFT:
      return [
        SolicitationStatus.PUBLISHED,
        SolicitationStatus.CANCELLED,
      ];

    case SolicitationStatus.PUBLISHED:
      return [
        SolicitationStatus.OPEN,
        SolicitationStatus.SUSPENDED,
        SolicitationStatus.CANCELLED,
      ];

    case SolicitationStatus.OPEN:
      return [
        SolicitationStatus.UNDER_EVALUATION,
        SolicitationStatus.SUSPENDED,
        SolicitationStatus.CANCELLED,
      ];

    case SolicitationStatus.UNDER_EVALUATION:
      return [
        SolicitationStatus.AWARDED,
        SolicitationStatus.CLOSED,
      ];

    case SolicitationStatus.AWARDED:
      return [SolicitationStatus.CLOSED];

    case SolicitationStatus.CLOSED:
      return [SolicitationStatus.ARCHIVED];

    case SolicitationStatus.CANCELLED:
      return [SolicitationStatus.ARCHIVED];

    case SolicitationStatus.SUSPENDED:
      return [
        SolicitationStatus.PUBLISHED,
        SolicitationStatus.OPEN,
        SolicitationStatus.CANCELLED,
      ];

    case SolicitationStatus.ARCHIVED:
      return [];

    default:
      return [];
  }
}

export function canTransitionSolicitationStatus(
  currentStatus: SolicitationStatus,
  nextStatus: SolicitationStatus,
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  return getAllowedSolicitationStatusTransitions(
    currentStatus,
  ).includes(nextStatus);
}

export function validateSolicitationStatusTransition(
  currentStatus: SolicitationStatus,
  nextStatus: SolicitationStatus,
): string | null {
  if (currentStatus === nextStatus) {
    return null;
  }

  if (
    !canTransitionSolicitationStatus(
      currentStatus,
      nextStatus,
    )
  ) {
    return `Solicitation cannot transition from ${getSolicitationStatusLabel(
      currentStatus,
    )} to ${getSolicitationStatusLabel(nextStatus)}.`;
  }

  return null;
}