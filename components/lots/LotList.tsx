"use client";

import React from "react";
import LotCard, {
  LotStatusValue,
} from "@/components/lots/LotCard";
import EmptyState from "@/components/ui/EmptyState";

export interface LotListItem {
  id: string;
  number: number | string;
  title: string;
  description?: string | null;
  status: LotStatusValue;
  estimatedValue?: string | number | null;
  currencyCode?: string | null;
  solicitationNumber?: string | null;
  solicitationTitle?: string | null;
  href?: string;
}

export interface LotListProps {
  lots: LotListItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export default function LotList({
  lots,
  emptyTitle = "No lots found",
  emptyDescription = "There are no lots available for this solicitation.",
  className = "",
}: LotListProps) {
  if (lots.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-5 md:grid-cols-2 ${className}`}
    >
      {lots.map((lot) => (
        <LotCard
          key={lot.id}
          id={lot.id}
          number={lot.number}
          title={lot.title}
          description={lot.description}
          status={lot.status}
          estimatedValue={lot.estimatedValue}
          currencyCode={lot.currencyCode}
          solicitationNumber={lot.solicitationNumber}
          solicitationTitle={lot.solicitationTitle}
          href={lot.href}
        />
      ))}
    </div>
  );
}