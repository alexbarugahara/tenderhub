"use client";

import React from "react";
import ProcurementStatus, {
  ProcurementStatusValue,
} from "@/components/procurement/ProcurementStatus";

export interface ProcurementTimelineItem {
  id: string;
  title: string;
  description?: string | null;
  date: string | Date;
  status?: ProcurementStatusValue;
  completed?: boolean;
}

export interface ProcurementTimelineProps {
  items: ProcurementTimelineItem[];
  className?: string;
}

function formatDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function ProcurementTimeline({
  items,
  className = "",
}: ProcurementTimelineProps) {
  if (items.length === 0) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}
      >
        <p className="text-sm text-gray-500">
          No procurement activity has been recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCompleted = item.completed ?? true;

          return (
            <div key={item.id} className="relative flex gap-4">
              {!isLast && (
                <div
                  aria-hidden="true"
                  className="absolute left-[11px] top-7 h-[calc(100%-4px)] w-px bg-gray-200"
                />
              )}

              <div className="relative z-10 flex shrink-0 items-start justify-center">
                <div
                  className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? "border-tenderhub-gold bg-tenderhub-gold"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isCompleted && (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5 text-white"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.3a1 1 0 0 1-1.42.006l-3.75-3.7a1 1 0 1 1 1.408-1.42l3.04 2.997 6.545-6.59a1 1 0 0 1 1.421-.007Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>

              <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-8"}`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-tenderhub-navy">
                      {item.title}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(item.date)}
                    </p>
                  </div>

                  {item.status && (
                    <div className="shrink-0">
                      <ProcurementStatus status={item.status} size="sm" />
                    </div>
                  )}
                </div>

                {item.description && (
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}