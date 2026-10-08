"use client";

import React from "react";

export type SolicitationTypeFilterValue =
  | ""
  | "RFP"
  | "RFQ"
  | "ITB"
  | "ITT"
  | "EOI"
  | "RFI"
  | "DIRECT";

export interface SolicitationTypeFiltersProps {
  value?: SolicitationTypeFilterValue;
  onChange?: (value: SolicitationTypeFilterValue) => void;
  className?: string;
}

const filterOptions: Array<{
  value: SolicitationTypeFilterValue;
  label: string;
}> = [
  { value: "", label: "All" },
  { value: "RFP", label: "RFP" },
  { value: "RFQ", label: "RFQ" },
  { value: "ITB", label: "ITB" },
  { value: "ITT", label: "ITT" },
  { value: "EOI", label: "EOI" },
  { value: "RFI", label: "RFI" },
  { value: "DIRECT", label: "Direct Procurement" },
];

export default function SolicitationTypeFilters({
  value = "",
  onChange,
  className = "",
}: SolicitationTypeFiltersProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`}
      role="group"
      aria-label="Solicitation type filters"
    >
      {filterOptions.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value || "all"}
            type="button"
            onClick={() => onChange?.(option.value)}
            aria-pressed={isActive}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "border-tenderhub-navy bg-tenderhub-navy text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-tenderhub-gold hover:text-tenderhub-navy"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}