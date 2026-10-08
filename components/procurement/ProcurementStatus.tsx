"use client";

import React from "react";
import Badge, { BadgeVariant } from "@/components/ui/Badge";

export type ProcurementStatusValue =
  | "DRAFT"
  | "PLANNED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export interface ProcurementStatusProps {
  status: ProcurementStatusValue;
  size?: "sm" | "md";
  className?: string;
}

const statusLabels: Record<ProcurementStatusValue, string> = {
  DRAFT: "Draft",
  PLANNED: "Planned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  ARCHIVED: "Archived",
};

const statusVariants: Record<ProcurementStatusValue, BadgeVariant> = {
  DRAFT: "default",
  PLANNED: "info",
  ACTIVE: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  ARCHIVED: "default",
};

export default function ProcurementStatus({
  status,
  size = "sm",
  className = "",
}: ProcurementStatusProps) {
  return (
    <Badge
      variant={statusVariants[status]}
      size={size}
      dot
      className={className}
    >
      {statusLabels[status]}
    </Badge>
  );
}