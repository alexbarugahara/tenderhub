"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export interface SolicitationTimelineItem {
  id: string;
  title: string;
  description?: string | null;
  date: string | Date;
  status?: "completed" | "current" | "upcoming";
}

export interface SolicitationTimelineProps {
  items: SolicitationTimelineItem[];
  title?: string;
  emptyMessage?: string;
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

function getStatusLabel(
  status: SolicitationTimelineItem["status"],
): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "current":
      return "Current";
    case "upcoming":
      return "Upcoming";
    default:
      return "Event";
  }
}

function getStatusVariant(
  status: SolicitationTimelineItem["status"],
): "success" | "info" | "default" {
  switch (status) {
    case "completed":
      return "success";
    case "current":
      return "info";
    default:
      return "default";
  }
}

export default function SolicitationTimeline({
  items,
  title = "Solicitation Timeline",
  emptyMessage = "No timeline events are available.",
  className = "",
}: SolicitationTimelineProps) {
  return (
    <Card className={className}>
      <div>
        <h2 className="text-lg font-semibold text-tenderhub-navy">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Key events and dates for this solicitation.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="mt-6">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <div key={item.id} className="relative flex gap-4">
                {!isLast && (
                  <div
                    className="absolute left-2 top-5 h-full w-px bg-gray-200"
                    aria-hidden="true"
                  />
                )}

                <div className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-tenderhub-navy bg-white">
                  <div className="h-1.5 w-1.5 rounded-full bg-tenderhub-gold" />
                </div>

                <div
                  className={`min-w-0 flex-1 ${
                    isLast ? "pb-0" : "pb-7"
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs font-medium text-gray-500">
                        {formatDate(item.date)}
                      </p>
                    </div>

                    {item.status && (
                      <Badge
                        variant={getStatusVariant(item.status)}
                        size="sm"
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
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
      )}
    </Card>
  );
}