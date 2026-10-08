"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export interface EvaluationCriterion {
id: string;
name: string;
description?: string | null;
weight?: number | null;
maxScore?: number | null;
sortOrder?: number | null;
isMandatory?: boolean | null;
}

export interface EvaluationCriteriaProps {
criteria: EvaluationCriterion[];
title?: string;
description?: string;
emptyMessage?: string;
showDescription?: boolean;
showWeight?: boolean;
showScore?: boolean;
showMandatory?: boolean;
className?: string;
}

function formatNumber(value: number | null | undefined): string {
if (value === null || value === undefined) {
return "—";
}

return Number.isInteger(value)
? value.toString()
: value.toLocaleString(undefined, {
maximumFractionDigits: 2,
});
}

export default function EvaluationCriteria({
criteria,
title = "Evaluation Criteria",
description = "Criteria that will be used to evaluate bids submitted for this solicitation.",
emptyMessage = "No evaluation criteria have been configured for this solicitation.",
showDescription = true,
showWeight = true,
showScore = true,
showMandatory = true,
className = "",
}: EvaluationCriteriaProps) {
const sortedCriteria = [...criteria].sort((a, b) => {
const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;


return aOrder - bOrder;


});

const totalWeight = sortedCriteria.reduce(
(total, criterion) => total + (criterion.weight ?? 0),
0,
);

return ( <Card className={className}> <div> <h2 className="text-lg font-semibold text-tenderhub-navy">
{title} </h2>


    {description && (
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {description}
      </p>
    )}
  </div>

  {sortedCriteria.length === 0 ? (
    <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5h6M9 9h6M9 13h4M7 3.5h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"
          />
        </svg>
      </div>

      <p className="mt-3 text-sm font-medium text-slate-700">
        {emptyMessage}
      </p>
    </div>
  ) : (
    <div className="mt-5 space-y-3">
      {sortedCriteria.map((criterion, index) => (
        <div
          key={criterion.id}
          className="rounded-lg border border-slate-200 p-4"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tenderhub-navy text-sm font-bold text-white">
                {index + 1}
              </div>

              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900">
                  {criterion.name}
                </h3>

                {showDescription && criterion.description && (
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {criterion.description}
                  </p>
                )}
              </div>
            </div>

            {showMandatory && criterion.isMandatory !== null &&
              criterion.isMandatory !== undefined && (
                <Badge
                  variant={
                    criterion.isMandatory ? "warning" : "default"
                  }
                  size="sm"
                >
                  {criterion.isMandatory
                    ? "Mandatory"
                    : "Optional"}
                </Badge>
              )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {showWeight && (
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Weight
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {criterion.weight !== null &&
                  criterion.weight !== undefined
                    ? `${formatNumber(criterion.weight)}%`
                    : "Not specified"}
                </p>
              </div>
            )}

            {showScore && (
              <div className="rounded-lg bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Maximum Score
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {formatNumber(criterion.maxScore)}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}

      {showWeight && (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-600">
            Total Weight
          </span>

          <span
            className={`text-sm font-bold ${
              Math.abs(totalWeight - 100) < 0.01
                ? "text-emerald-700"
                : "text-slate-800"
            }`}
          >
            {formatNumber(totalWeight)}%
          </span>
        </div>
      )}
    </div>
  )}
</Card>


);
}
