"use client";

import React from "react";
import Badge, { BadgeVariant } from "@/components/ui/Badge";

export type SolicitationStatusValue =
  | "DRAFT"
  | "PUBLISHED"
  | "OPEN"
  | "UNDER_EVALUATION"
  | "AWARDED"
  | "CLOSED"
  | "CANCELLED"
  | "SUSPENDED"
  | "ARCHIVED";

export interface SolicitationStatusProps {
  status: SolicitationStatusValue;
  size?: "sm" | "md";
  className?: string;
}

const statusLabels: Record<SolicitationStatusValue, string> = {
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

const statusVariants: Record<SolicitationStatusValue, BadgeVariant> = {
  DRAFT: "default",
  PUBLISHED: "info",
  OPEN: "success",
  UNDER_EVALUATION: "warning",
  AWARDED: "gold",
  CLOSED: "default",
  CANCELLED: "danger",
  SUSPENDED: "warning",
  ARCHIVED: "default",
};

export default function SolicitationStatus({
  status,
  size = "sm",
  className = "",
}: SolicitationStatusProps) {
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