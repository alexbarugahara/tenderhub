"use client";

import React, { useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export interface SolicitationFilterValues {
  search: string;
  status: string;
  type: string;
  procurementMethod: string;
  countryId: string;
  closingDateFrom: string;
  closingDateTo: string;
}

export interface SolicitationFiltersProps {
  initialValues?: Partial<SolicitationFilterValues>;
  countries?: Array<{
    id: string;
    name: string;
  }>;
  onApply?: (filters: SolicitationFilterValues) => void;
  onReset?: () => void;
  className?: string;
}

const defaultValues: SolicitationFilterValues = {
  search: "",
  status: "",
  type: "",
  procurementMethod: "",
  countryId: "",
  closingDateFrom: "",
  closingDateTo: "",
};

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "PUBLISHED", label: "Published" },
  { value: "OPEN", label: "Open" },
  { value: "UNDER_EVALUATION", label: "Under Evaluation" },
  { value: "AWARDED", label: "Awarded" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "SUSPENDED", label: "Suspended" },
];

const typeOptions = [
  { value: "", label: "All types" },
  { value: "RFI", label: "Request for Information" },
  { value: "EOI", label: "Expression of Interest" },
  { value: "RFQ", label: "Request for Quotation" },
  { value: "RFP", label: "Request for Proposal" },
  { value: "ITB", label: "Invitation to Bid" },
  { value: "ITT", label: "Invitation to Tender" },
  { value: "IFB", label: "Invitation for Bids" },
  { value: "OTHER", label: "Other" },
];

const procurementMethodOptions = [
  { value: "", label: "All methods" },
  { value: "OPEN", label: "Open" },
  { value: "RESTRICTED", label: "Restricted" },
  { value: "RFQ", label: "Request for Quotation" },
  { value: "DIRECT", label: "Direct" },
  { value: "NEGOTIATED", label: "Negotiated" },
];

export default function SolicitationFilters({
  initialValues,
  countries = [],
  onApply,
  onReset,
  className = "",
}: SolicitationFiltersProps) {
  const [filters, setFilters] = useState<SolicitationFilterValues>({
    ...defaultValues,
    ...initialValues,
  });

  const countryOptions = [
    { value: "", label: "All countries" },
    ...countries.map((country) => ({
      value: country.id,
      label: country.name,
    })),
  ];

  const updateFilter = (
    field: keyof SolicitationFilterValues,
    value: string,
  ) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleApply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply?.(filters);
  };

  const handleReset = () => {
    setFilters(defaultValues);
    onReset?.();
  };

  return (
    <form
      onSubmit={handleApply}
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-tenderhub-navy">
          Find Solicitations
        </h2>

        <p className="text-sm text-gray-500">
          Search and filter procurement opportunities.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-3">
          <Input
            label="Search"
            placeholder="Search by title, solicitation number, or keyword..."
            value={filters.search}
            onChange={(event) =>
              updateFilter("search", event.target.value)
            }
          />
        </div>

        <Select
          label="Status"
          value={filters.status}
          options={statusOptions}
          onChange={(event) =>
            updateFilter("status", event.target.value)
          }
        />

        <Select
          label="Type"
          value={filters.type}
          options={typeOptions}
          onChange={(event) =>
            updateFilter("type", event.target.value)
          }
        />

        <Select
          label="Procurement Method"
          value={filters.procurementMethod}
          options={procurementMethodOptions}
          onChange={(event) =>
            updateFilter("procurementMethod", event.target.value)
          }
        />

        <Select
          label="Country"
          value={filters.countryId}
          options={countryOptions}
          onChange={(event) =>
            updateFilter("countryId", event.target.value)
          }
        />

        <Input
          label="Closing Date From"
          type="date"
          value={filters.closingDateFrom}
          onChange={(event) =>
            updateFilter("closingDateFrom", event.target.value)
          }
        />

        <Input
          label="Closing Date To"
          type="date"
          value={filters.closingDateTo}
          onChange={(event) =>
            updateFilter("closingDateTo", event.target.value)
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          className="w-full sm:w-auto"
        >
          Reset
        </Button>

        <Button
          type="submit"
          variant="primary"
          className="w-full sm:w-auto"
        >
          Apply Filters
        </Button>
      </div>
    </form>
  );
}