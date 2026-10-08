"use client";

import React from "react";

interface TenderAnalyticsProps {
  tenderActivity?: {
    month: string;
    tenders: number;
  }[];

  applicationsPerTender?: {
    tender: string;
    applications: number;
  }[];

  tenderStatus?: {
    status: string;
    count: number;
  }[];
}

const STATUS_CLASSES = [
  "bg-[#D4AF37]",
  "bg-[#071A33]",
  "bg-blue-600",
  "bg-green-600",
  "bg-purple-600",
];

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function getMaxValue(values: number[]): number {
  return Math.max(...values, 1);
}

export default function TenderAnalytics({
  tenderActivity = [],
  applicationsPerTender = [],
  tenderStatus = [],
}: TenderAnalyticsProps) {
  const hasActivity = tenderActivity.length > 0;
  const hasApplications = applicationsPerTender.length > 0;
  const hasStatus = tenderStatus.length > 0;

  const activityMax = getMaxValue(
    tenderActivity.map((item) => item.tenders),
  );

  const applicationsMax = getMaxValue(
    applicationsPerTender.map((item) => item.applications),
  );

  const totalStatusCount = tenderStatus.reduce(
    (total, item) => total + item.count,
    0,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ================= SOLICITATION ACTIVITY ================= */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="mb-6 text-lg font-bold text-[#071A33]">
          Solicitation Activity
        </h3>

        {hasActivity ? (
          <div className="space-y-4">
            <div className="flex h-[300px] items-end gap-3 overflow-x-auto border-b border-gray-200 px-2 pb-0">
              {tenderActivity.map((item) => {
                const height =
                  (item.tenders / activityMax) * 100;

                return (
                  <div
                    key={item.month}
                    className="flex h-full min-w-[48px] flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-xs font-semibold text-gray-600">
                      {formatNumber(item.tenders)}
                    </span>

                    <div
                      className="w-full max-w-12 rounded-t-lg bg-[#071A33] transition-all"
                      style={{
                        height: `${Math.max(height, 2)}%`,
                      }}
                      title={`${item.month}: ${formatNumber(item.tenders)} solicitations`}
                    />

                    <span className="text-xs text-gray-500">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-[300px] flex-col items-center justify-center text-center">
            <div className="mb-3 text-4xl">📊</div>

            <p className="font-semibold text-gray-700">
              No solicitation activity yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Solicitation activity will appear here.
            </p>
          </div>
        )}
      </div>

      {/* ================= APPLICATIONS PER SOLICITATION ================= */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-bold text-[#071A33]">
          Bids Per Solicitation
        </h3>

        {hasApplications ? (
          <div className="space-y-5">
            {applicationsPerTender.map((item) => {
              const percentage =
                (item.applications / applicationsMax) * 100;

              return (
                <div key={item.tender}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span
                      className="min-w-0 truncate text-sm font-medium text-gray-700"
                      title={item.tender}
                    >
                      {item.tender}
                    </span>

                    <span className="shrink-0 text-sm font-bold text-[#071A33]">
                      {formatNumber(item.applications)}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#D4AF37] transition-all"
                      style={{
                        width: `${Math.max(percentage, 2)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-[320px] flex-col items-center justify-center text-center">
            <div className="mb-3 text-4xl">📊</div>

            <p className="font-semibold text-gray-700">
              No bids yet
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Bid activity will appear here.
            </p>
          </div>
        )}
      </div>

      {/* ================= SOLICITATION STATUS ================= */}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-lg font-bold text-[#071A33]">
          Solicitation Status
        </h3>

        {hasStatus ? (
          <div className="space-y-5">
            {tenderStatus.map((item, index) => {
              const percentage =
                totalStatusCount > 0
                  ? (item.count / totalStatusCount) * 100
                  : 0;

              return (
                <div key={item.status}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`h-3 w-3 shrink-0 rounded-full ${
                          STATUS_CLASSES[
                            index % STATUS_CLASSES.length
                          ]
                        }`}
                      />

                      <span className="truncate text-sm font-medium text-gray-700">
                        {item.status}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-bold text-[#071A33]">
                        {formatNumber(item.count)}
                      </span>

                      <span className="text-xs text-gray-400">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${
                        STATUS_CLASSES[
                          index % STATUS_CLASSES.length
                        ]
                      }`}
                      style={{
                        width: `${Math.max(percentage, 2)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="mt-6 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">
                  Total Solicitations
                </span>

                <span className="text-lg font-bold text-[#071A33]">
                  {formatNumber(totalStatusCount)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-[320px] flex-col items-center justify-center text-center">
            <div className="mb-3 text-4xl">📁</div>

            <p className="font-semibold text-gray-700">
              No solicitation status data available
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Solicitation status information will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
