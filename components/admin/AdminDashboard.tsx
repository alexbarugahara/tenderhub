"use client";

import React from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export interface AdminDashboardMetric {
  id: string;
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label?: string;
    direction?: "UP" | "DOWN" | "NEUTRAL";
  };
}

export interface AdminDashboardActivity {
  id: string;
  title: string;
  description?: string;
  timestamp: string | Date;
  type?:
    | "INFO"
    | "SUCCESS"
    | "WARNING"
    | "ERROR";
}

export interface AdminDashboardQuickAction {
  id: string;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
}

export interface AdminDashboardProps {
  metrics?: AdminDashboardMetric[];
  recentActivity?: AdminDashboardActivity[];
  quickActions?: AdminDashboardQuickAction[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  className?: string;
}

function formatDate(
  value: string | Date,
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getActivityVariant(
  type?: AdminDashboardActivity["type"],
): "success" | "warning" | "danger" | "default" {
  switch (type) {
    case "SUCCESS":
      return "success";

    case "WARNING":
      return "warning";

    case "ERROR":
      return "danger";

    case "INFO":
    default:
      return "default";
  }
}

function getTrendText(
  trend?: AdminDashboardMetric["trend"],
): string | null {
  if (!trend) {
    return null;
  }

  const prefix =
    trend.direction === "DOWN"
      ? "↓"
      : trend.direction === "UP"
        ? "↑"
        : "→";

  const value = Math.abs(trend.value);

  return `${prefix} ${value}%${
    trend.label
      ? ` ${trend.label}`
      : ""
  }`;
}

export default function AdminDashboard({
  metrics = [],
  recentActivity = [],
  quickActions = [],
  loading = false,
  error = null,
  onRefresh,
  className = "",
}: AdminDashboardProps) {
  if (loading) {
    return (
      <div
        className={`space-y-6 ${className}`}
        aria-busy="true"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="h-10 w-24 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <div className="animate-pulse space-y-4">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-8 w-24 rounded bg-gray-200" />
                <div className="h-3 w-40 rounded bg-gray-200" />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-40 rounded bg-gray-200" />

              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-14 rounded bg-gray-100"
                />
              ))}
            </div>
          </Card>

          <Card>
            <div className="animate-pulse space-y-4">
              <div className="h-5 w-36 rounded bg-gray-200" />

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-12 rounded bg-gray-100"
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>

          {onRefresh && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onRefresh}
              >
                Try Again
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tenderhub-navy">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage TenderHub platform
            activity.
          </p>
        </div>

        {onRefresh && (
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
          >
            Refresh
          </Button>
        )}
      </div>

      {/* Metrics */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const trendText =
              getTrendText(metric.trend);

            return (
              <Card key={metric.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500">
                      {metric.label}
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-tenderhub-navy">
                      {metric.value}
                    </p>

                    {metric.description && (
                      <p className="mt-2 text-xs leading-5 text-gray-500">
                        {metric.description}
                      </p>
                    )}
                  </div>

                  {trendText && (
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                        metric.trend?.direction ===
                        "DOWN"
                          ? "bg-red-50 text-red-700"
                          : metric.trend?.direction ===
                              "UP"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {trendText}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-tenderhub-navy">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Latest activity across the platform.
              </p>
            </div>

            {recentActivity.length > 0 && (
              <Badge variant="default">
                {recentActivity.length}
              </Badge>
            )}
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-500">
                No recent activity to display.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentActivity.map(
                (activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-4 py-4"
                  >
                    <div
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        activity.type ===
                        "SUCCESS"
                          ? "bg-green-100 text-green-700"
                          : activity.type ===
                              "WARNING"
                            ? "bg-yellow-100 text-yellow-700"
                            : activity.type ===
                                "ERROR"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                      aria-hidden="true"
                    >
                      {activity.type ===
                      "SUCCESS"
                        ? "✓"
                        : activity.type ===
                            "ERROR"
                          ? "!"
                          : "•"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>

                        <time className="shrink-0 text-xs text-gray-400">
                          {formatDate(
                            activity.timestamp,
                          )}
                        </time>
                      </div>

                      {activity.description && (
                        <p className="mt-1 text-sm leading-5 text-gray-500">
                          {activity.description}
                        </p>
                      )}

                      {activity.type && (
                        <div className="mt-2">
                          <Badge
                            variant={getActivityVariant(
                              activity.type,
                            )}
                          >
                            {activity.type}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Common administration tasks.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {quickActions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center">
                <p className="text-sm text-gray-500">
                  No quick actions available.
                </p>
              </div>
            ) : (
              quickActions.map((action) => {
                const content = (
                  <>
                    <span className="block font-medium text-gray-900">
                      {action.label}
                    </span>

                    {action.description && (
                      <span className="mt-1 block text-xs leading-5 text-gray-500">
                        {action.description}
                      </span>
                    )}
                  </>
                );

                if (action.href) {
                  return (
                    <a
                      key={action.id}
                      href={action.href}
                      className="block rounded-lg border border-gray-200 p-4 transition hover:border-tenderhub-gold hover:bg-gray-50"
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.onClick}
                    disabled={!action.onClick}
                    className="block w-full rounded-lg border border-gray-200 p-4 text-left transition hover:border-tenderhub-gold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {content}
                  </button>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}