"use client";

import React from "react";
import Badge from "@/components/ui/Badge";

export type ComplianceStatusValue =
  | "PENDING"
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "EXPIRED"
  | "EXPIRING"
  | "NOT_APPLICABLE";

export interface ComplianceStatusProps {
  status: ComplianceStatusValue;
  size?: "sm" | "md";
  showLabel?: boolean;
  dot?: boolean;
  className?: string;
}

const statusLabels: Record<ComplianceStatusValue, string> = {
  PENDING: "Pending",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  EXPIRED: "Expired",
  EXPIRING: "Expiring",
  NOT_APPLICABLE: "Not Applicable",
};

const statusVariants: Record<
  ComplianceStatusValue,
  "default" | "success" | "danger" | "warning" | "info"
> = {
  PENDING: "default",
  COMPLIANT: "success",
  NON_COMPLIANT: "danger",
  EXPIRED: "danger",
  EXPIRING: "warning",
  NOT_APPLICABLE: "default",
};

export default function ComplianceStatus({
  status,
  className = "",
  showLabel = true,
}: ComplianceStatusProps) {
  return (
    <Badge
      variant={statusVariants[status]}
      className={className}
    >
      {showLabel ? statusLabels[status] : null}
    </Badge>
  );
}