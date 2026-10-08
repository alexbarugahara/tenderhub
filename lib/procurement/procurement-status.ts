import {
  ProcurementStatus,
} from "@prisma/client";

export const PROCUREMENT_STATUS_LABELS: Record<
  ProcurementStatus,
  string
> = {
  DRAFT: "Draft",
  PLANNED: "Planned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  ARCHIVED: "Archived",
};

export const PROCUREMENT_STATUS_DESCRIPTIONS: Record<
  ProcurementStatus,
  string
> = {
  DRAFT: "The procurement is being prepared and has not yet been activated.",
  PLANNED: "The procurement is approved or scheduled but has not yet started.",
  ACTIVE: "The procurement is currently in progress.",
  COMPLETED: "The procurement process has been completed.",
  CANCELLED: "The procurement has been cancelled.",
  ARCHIVED: "The procurement has been archived for historical reference.",
};

export function getProcurementStatusLabel(
  status: ProcurementStatus,
): string {
  return PROCUREMENT_STATUS_LABELS[status];
}

export function getProcurementStatusDescription(
  status: ProcurementStatus,
): string {
  return PROCUREMENT_STATUS_DESCRIPTIONS[status];
}

export function isProcurementStatus(
  value: unknown,
): value is ProcurementStatus {
  return Object.values(ProcurementStatus).includes(
    value as ProcurementStatus,
  );
}

export function isProcurementEditable(
  status: ProcurementStatus,
): boolean {
  return (
    status === ProcurementStatus.DRAFT ||
    status === ProcurementStatus.PLANNED ||
    status === ProcurementStatus.ACTIVE
  );
}

export function isProcurementTerminal(
  status: ProcurementStatus,
): boolean {
  return (
    status === ProcurementStatus.COMPLETED ||
    status === ProcurementStatus.CANCELLED ||
    status === ProcurementStatus.ARCHIVED
  );
}

export function canActivateProcurement(
  status: ProcurementStatus,
): boolean {
  return (
    status === ProcurementStatus.DRAFT ||
    status === ProcurementStatus.PLANNED
  );
}

export function canCompleteProcurement(
  status: ProcurementStatus,
): boolean {
  return status === ProcurementStatus.ACTIVE;
}

export function canCancelProcurement(
  status: ProcurementStatus,
): boolean {
  return (
    status === ProcurementStatus.DRAFT ||
    status === ProcurementStatus.PLANNED ||
    status === ProcurementStatus.ACTIVE
  );
}

export function canArchiveProcurement(
  status: ProcurementStatus,
): boolean {
  return (
    status === ProcurementStatus.COMPLETED ||
    status === ProcurementStatus.CANCELLED
  );
}

export function getAllowedProcurementStatusTransitions(
  currentStatus: ProcurementStatus,
): ProcurementStatus[] {
  switch (currentStatus) {
    case ProcurementStatus.DRAFT:
      return [
        ProcurementStatus.PLANNED,
        ProcurementStatus.ACTIVE,
        ProcurementStatus.CANCELLED,
      ];

    case ProcurementStatus.PLANNED:
      return [
        ProcurementStatus.ACTIVE,
        ProcurementStatus.CANCELLED,
      ];

    case ProcurementStatus.ACTIVE:
      return [
        ProcurementStatus.COMPLETED,
        ProcurementStatus.CANCELLED,
      ];

    case ProcurementStatus.COMPLETED:
      return [ProcurementStatus.ARCHIVED];

    case ProcurementStatus.CANCELLED:
      return [ProcurementStatus.ARCHIVED];

    case ProcurementStatus.ARCHIVED:
      return [];

    default:
      return [];
  }
}

export function canTransitionProcurementStatus(
  currentStatus: ProcurementStatus,
  nextStatus: ProcurementStatus,
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  return getAllowedProcurementStatusTransitions(
    currentStatus,
  ).includes(nextStatus);
}

export function validateProcurementStatusTransition(
  currentStatus: ProcurementStatus,
  nextStatus: ProcurementStatus,
): string | null {
  if (currentStatus === nextStatus) {
    return null;
  }

  if (
    !canTransitionProcurementStatus(
      currentStatus,
      nextStatus,
    )
  ) {
    return `Procurement cannot transition from ${getProcurementStatusLabel(
      currentStatus,
    )} to ${getProcurementStatusLabel(nextStatus)}.`;
  }

  return null;
}