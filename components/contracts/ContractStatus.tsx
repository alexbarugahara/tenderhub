"use client";

import React from "react";
import Badge from "@/components/ui/Badge";

export type ContractStatusValue =
  | "DRAFT"
  | "PENDING_SIGNATURE"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "TERMINATED"
  | "EXPIRED";

export interface ContractStatusProps {
  status: ContractStatusValue;
  size?: "sm" | "md";
  className?: string;
}

const statusLabels: Record<ContractStatusValue, string> = {
  DRAFT: "Draft",
  PENDING_SIGNATURE: "Pending Signature",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  TERMINATED: "Terminated",
  EXPIRED: "Expired",
};

const statusVariants: Record<
  ContractStatusValue,
  "default" | "success" | "warning" | "danger"
> = {
  DRAFT: "default",
  PENDING_SIGNATURE: "warning",
  ACTIVE: "success",
  ON_HOLD: "warning",
  COMPLETED: "success",
  TERMINATED: "danger",
  EXPIRED: "default",
};

export default function ContractStatus({
  status,
  className = "",
}: ContractStatusProps) {
  return (
    <Badge
      variant={statusVariants[status]}
      className={className}
    >
      {statusLabels[status]}
    </Badge>
  );
}
