"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export type ExpirationAlertStatus =
  | "EXPIRING"
  | "EXPIRED";

export interface ExpirationAlertItem {
  id: string;
  name: string;
  status: ExpirationAlertStatus;
  expiresAt: Date | string;
  vendorName?: string | null;
  category?: string | null;
  mandatory?: boolean;
}

export interface ExpirationAlertsProps {
  alerts: ExpirationAlertItem[];
  loading?: boolean;
  daysThreshold?: number;
  onView?: (alert: ExpirationAlertItem) => void;
  className?: string;
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getDaysUntilExpiry(value: Date | string): number | null {
  const expiryDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(expiryDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  expiryDate.setHours(0, 0, 0, 0);

  return Math.ceil(
    (expiryDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

function getRelativeExpiryText(value: Date | string): string {
  const days = getDaysUntilExpiry(value);

  if (days === null) {
    return "Expiry date unavailable";
  }

  if (days < 0) {
    const absoluteDays = Math.abs(days);

    return `Expired ${absoluteDays} day${
      absoluteDays === 1 ? "" : "s"
    } ago`;
  }

  if (days === 0) {
    return "Expires today";
  }

  if (days === 1) {
    return "Expires tomorrow";
  }

  return `Expires in ${days} days`;
}

export default function ExpirationAlerts({
  alerts,
  loading = false,
  daysThreshold = 30,
  onView,
  className = "",
}: ExpirationAlertsProps) {
  const expiredCount = alerts.filter(
    (alert) => alert.status === "EXPIRED",
  ).length;

  const expiringCount = alerts.filter(
    (alert) => alert.status === "EXPIRING",
  ).length;

  if (loading) {
    return (
      <Card className={className}>
        <div className="animate-pulse space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-40 rounded bg-gray-200" />
              <div className="h-4 w-64 rounded bg-gray-200" />
            </div>

            <div className="h-8 w-20 rounded bg-gray-200" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 rounded-lg bg-gray-100"
              />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Expiration Alerts
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Monitor compliance records that have expired or are
              approaching their expiry date.
            </p>
          </div>

          {alerts.length > 0 && (
            <Badge
              variant={expiredCount > 0 ? "danger" : "warning"}
            >
              {alerts.length} Alert{alerts.length === 1 ? "" : "s"}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total Alerts
            </p>

            <p className="mt-2 text-2xl font-semibold text-tenderhub-navy">
              {alerts.length}
            </p>
          </div>

          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-red-600">
              Expired
            </p>

            <p className="mt-2 text-2xl font-semibold text-red-700">
              {expiredCount}
            </p>
          </div>

          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
              Expiring
            </p>

            <p className="mt-2 text-2xl font-semibold text-amber-700">
              {expiringCount}
            </p>

            <p className="mt-1 text-xs text-amber-700">
              Within {daysThreshold} days
            </p>
          </div>
        </div>

        {alerts.length === 0 ? (
          <EmptyState
            title="No expiration alerts"
            description="There are currently no expired or upcoming compliance records requiring attention."
          />
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const isExpired = alert.status === "EXPIRED";

              return (
                <div
                  key={alert.id}
                  className={`rounded-lg border p-4 ${
                    isExpired
                      ? "border-red-200 bg-red-50/50"
                      : "border-amber-200 bg-amber-50/50"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {alert.name}
                        </h3>

                        <Badge
                          variant={isExpired ? "danger" : "warning"}
                        >
                          {isExpired ? "Expired" : "Expiring"}
                        </Badge>

                        {alert.mandatory && (
                          <Badge variant="danger">
                            Mandatory
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
                        {alert.vendorName && (
                          <span>
                            Vendor:{" "}
                            <span className="font-medium text-gray-800">
                              {alert.vendorName}
                            </span>
                          </span>
                        )}

                        {alert.category && (
                          <span>
                            Category:{" "}
                            <span className="font-medium text-gray-800">
                              {alert.category}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                        <span className="text-gray-500">
                          Expiry date:{" "}
                          <span className="font-medium text-gray-700">
                            {formatDate(alert.expiresAt)}
                          </span>
                        </span>

                        <span
                          className={
                            isExpired
                              ? "font-semibold text-red-600"
                              : "font-semibold text-amber-600"
                          }
                        >
                          {getRelativeExpiryText(alert.expiresAt)}
                        </span>
                      </div>
                    </div>

                    {onView && (
                      <div className="shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onView(alert)}
                        >
                          View
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
