"use client";

import React from "react";
import Badge from "@/components/ui/Badge";

export type BidStatusValue =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "SHORTLISTED"
  | "EVALUATED"
  | "WITHDRAWN"
  | "REJECTED"
  | "AWARDED";

export interface BidStatusProps {
  status: BidStatusValue;
  size?: "sm" | "md";
  className?: string;
}

const statusLabels: Record<BidStatusValue, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  SHORTLISTED: "Shortlisted",
  EVALUATED: "Evaluated",
  WITHDRAWN: "Withdrawn",
  REJECTED: "Rejected",
  AWARDED: "Awarded",
};

const statusVariants: Record<
  BidStatusValue,
  "default" | "success" | "warning" | "danger" | "info" | "primary" | "secondary"
> = {
  DRAFT: "default",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  COMPLIANT: "success",
  NON_COMPLIANT: "danger",
  SHORTLISTED: "primary",
  EVALUATED: "info",
  WITHDRAWN: "default",
  REJECTED: "danger",
  AWARDED: "primary",
};

export default function BidStatus({
  status,
  className = "",
}: BidStatusProps) {
  return (
    <Badge
      variant={statusVariants[status]}
      className={className}
    >
      {statusLabels[status]}
    </Badge>
  );
}