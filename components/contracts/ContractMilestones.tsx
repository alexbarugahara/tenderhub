"use client";

import React from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export type ContractMilestoneStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "OVERDUE"
  | "CANCELLED";

export interface ContractMilestoneItem {
  id: string;
  contractId: string;
  title: string;
  description?: string | null;
  dueDate: Date | string;
  completedDate?: Date | string | null;
  status: ContractMilestoneStatus;
  amount?: number | string | null;
  currencyCode?: string | null;
}

export interface ContractMilestonesProps {
  milestones: ContractMilestoneItem[];
  readOnly?: boolean;
  onAdd?: () => void;
  onEdit?: (milestone: ContractMilestoneItem) => void;
  onDelete?: (milestone: ContractMilestoneItem) => void;
  className?: string;
}

const statusLabels: Record<ContractMilestoneStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

const statusVariants: Record<
  ContractMilestoneStatus,
  "default" | "info" | "success" | "warning" | "danger"
> = {
  PENDING: "default",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  OVERDUE: "danger",
  CANCELLED: "warning",
};

function formatDate(
  value: Date | string | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAmount(
  amount?: number | string | null,
  currencyCode?: string | null,
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "—";
  }

  const numericAmount =
    typeof amount === "number" ? amount : Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "—";
  }

  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);

  return `${currencyCode ? `${currencyCode} ` : ""}${formattedAmount}`;
}

export default function ContractMilestones({
  milestones,
  readOnly = false,
  onAdd,
  onEdit,
  onDelete,
  className = "",
}: ContractMilestonesProps) {
  const sortedMilestones = [...milestones].sort((a, b) => {
    const firstDate = new Date(a.dueDate).getTime();
    const secondDate = new Date(b.dueDate).getTime();

    if (
      Number.isNaN(firstDate) ||
      Number.isNaN(secondDate)
    ) {
      return 0;
    }

    return firstDate - secondDate;
  });

  return (
    <Card className={className}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Contract Milestones
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track important deliverables and milestones throughout
              the contract lifecycle.
            </p>
          </div>

          {!readOnly && onAdd && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onAdd}
            >
              Add Milestone
            </Button>
          )}
        </div>

        {sortedMilestones.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center">
            <p className="text-sm font-medium text-gray-700">
              No milestones have been added.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Add milestones to track important contract deliverables
              and deadlines.
            </p>

            {!readOnly && onAdd && (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAdd}
                >
                  Add First Milestone
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedMilestones.map((milestone) => (
              <div
                key={milestone.id}
                className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {milestone.title}
                      </h3>

                      <Badge
                        variant={statusVariants[milestone.status]}
                      >
                        {statusLabels[milestone.status]}
                      </Badge>
                    </div>

                    {milestone.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                        {milestone.description}
                      </p>
                    )}
                  </div>

                  {!readOnly && (onEdit || onDelete) && (
                    <div className="flex shrink-0 gap-2">
                      {onEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(milestone)}
                        >
                          Edit
                        </Button>
                      )}

                      {onDelete && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => onDelete(milestone)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Due Date
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(milestone.dueDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Completed Date
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(milestone.completedDate)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      Amount
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-900">
                      {formatAmount(
                        milestone.amount,
                        milestone.currencyCode,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
