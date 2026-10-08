// lib/tender-actions.ts

export type TenderStatus =
  | "DRAFT"
  | "OPEN"
  | "CLOSED"
  | "AWARDED"
  | "CANCELLED"
  | "UNDER_EVALUATION"
  | "ARCHIVED"
  | "SUSPENDED";

export type TenderAction =
  | "VIEW"
  | "EDIT"
  | "PUBLISH"
  | "CLOSE"
  | "CANCEL"
  | "DUPLICATE"
  | "DELETE"
  | "AWARD"
  | "VIEW_AWARD"
  | "ARCHIVE";

export interface TenderActionConfig {
  label: string;
  action: TenderAction;
  color:
    | "gray"
    | "blue"
    | "green"
    | "orange"
    | "yellow"
    | "purple"
    | "red"
    | "emerald";
}

export const TENDER_ACTIONS: Record<
  TenderStatus,
  TenderActionConfig[]
> = {
  /**
   * Draft:
   * - Not visible to suppliers
   * - Can still be edited or deleted
   * - Can be opened
   */
  DRAFT: [
    {
      label: "View Details",
      action: "VIEW",
      color: "gray",
    },
    {
      label: "Edit",
      action: "EDIT",
      color: "blue",
    },
    {
      label: "Publish",
      action: "PUBLISH",
      color: "green",
    },
    {
      label: "Duplicate",
      action: "DUPLICATE",
      color: "purple",
    },
    {
      label: "Delete",
      action: "DELETE",
      color: "red",
    },
  ],

  /**
   * Open:
   * - Publicly available
   * - Suppliers can apply
   * - No deletion allowed
   */
  OPEN: [
    {
      label: "View Details",
      action: "VIEW",
      color: "gray",
    },
    {
      label: "Edit",
      action: "EDIT",
      color: "blue",
    },
    {
      label: "Close",
      action: "CLOSE",
      color: "orange",
    },
    {
      label: "Cancel",
      action: "CANCEL",
      color: "yellow",
    },
    {
      label: "Duplicate",
      action: "DUPLICATE",
      color: "purple",
    },
  ],

  /**
   * Closed:
   * - Supplier submissions have stopped
   * - Ready for evaluation/award
   */
  CLOSED: [
    {
      label: "View Details",
      action: "VIEW",
      color: "gray",
    },
    {
      label: "Award",
      action: "AWARD",
      color: "emerald",
    },
    {
      label: "Duplicate",
      action: "DUPLICATE",
      color: "purple",
    },
    {
      label: "Archive",
      action: "ARCHIVE",
      color: "gray",
    },
  ],

  /**
   * Award completed:
   * - Procurement decision recorded
   */
  AWARDED: [
    {
      label: "View Details",
      action: "VIEW",
      color: "gray",
    },
    {
      label: "View Award",
      action: "VIEW_AWARD",
      color: "emerald",
    },
    {
      label: "Duplicate",
      action: "DUPLICATE",
      color: "purple",
    },
    {
      label: "Archive",
      action: "ARCHIVE",
      color: "gray",
    },
  ],

  /**
   * Cancelled tender:
   * - Procurement process will not proceed
   */
  CANCELLED: [
    {
      label: "View Details",
      action: "VIEW",
      color: "gray",
    },
    {
      label: "Duplicate",
      action: "DUPLICATE",
      color: "purple",
    },
    {
      label: "Archive",
      action: "ARCHIVE",
      color: "gray",
    },
  ],

  /**
   * Under evaluation:
   *
   * This status exists in the Prisma schema but the current
   * status-management action does not define transitions into
   * or out of it.
   */
  UNDER_EVALUATION: [
    {
      label: "View Details",
      action: "VIEW",
      color: "gray",
    },
  ],

  /**
   * Archived tender:
   * - Preserved for procurement history/audit
   * - Can be restored to CLOSED by the current lifecycle
   */
  ARCHIVED: [
    {
      label: "View Details",
      action: "VIEW",
      color: "gray",
    },
  ],

  /**
   * Suspended tender:
   *
   * This status exists in the Prisma schema but the current
   * status-management action does not define transitions into
   * or out of it.
   */
  SUSPENDED: [
    {
      label: "View Details",
      action: "VIEW",
      color: "gray",
    },
  ],
};

/**
 * Get allowed actions for a tender status.
 */
export function getTenderActions(
  status: TenderStatus
): TenderActionConfig[] {
  return TENDER_ACTIONS[status] ?? [];
}

/**
 * Check whether a tender action is allowed.
 */
export function canPerformTenderAction(
  status: TenderStatus,
  action: TenderAction
): boolean {
  return (
    TENDER_ACTIONS[status]?.some(
      (item) => item.action === action
    ) ?? false
  );
}
