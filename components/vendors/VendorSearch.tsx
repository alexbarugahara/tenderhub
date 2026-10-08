"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import VendorCard, {
  VendorCardData,
} from "@/components/vendors/VendorCard";

export interface VendorSearchFilters {
  search: string;
  countryId: string;
  businessType: string;
  classification: string;
  verified: string;
}

export interface VendorSearchProps {
  vendors?: VendorCardData[];
  countryOptions?: Array<{
    value: string;
    label: string;
  }>;
  businessTypeOptions?: Array<{
    value: string;
    label: string;
  }>;
  loading?: boolean;
  initialFilters?: Partial<VendorSearchFilters>;
  onSearch?: (
    filters: VendorSearchFilters,
  ) => void | Promise<void>;
  onViewVendor?: (vendor: VendorCardData) => void;
  className?: string;
}

const defaultFilters: VendorSearchFilters = {
  search: "",
  countryId: "",
  businessType: "",
  classification: "",
  verified: "",
};

export default function VendorSearch({
  vendors = [],
  countryOptions = [],
  businessTypeOptions = [],
  loading = false,
  initialFilters,
  onSearch,
  onViewVendor,
  className = "",
}: VendorSearchProps) {
  const [filters, setFilters] = useState<VendorSearchFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFilters({
      ...defaultFilters,
      ...initialFilters,
    });
  }, [initialFilters]);

  function updateFilter<K extends keyof VendorSearchFilters>(
    field: K,
    value: VendorSearchFilters[K],
  ) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!onSearch) {
      return;
    }

    setSubmitting(true);

    try {
      await onSearch({
        ...filters,
        search: filters.search.trim(),
        classification: filters.classification.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    const resetFilters = { ...defaultFilters };

    setFilters(resetFilters);

    if (!onSearch) {
      return;
    }

    setSubmitting(true);

    try {
      await onSearch(resetFilters);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Find Vendors
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Search and filter vendors by business information,
              classification, location, and verification status.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Input
                label="Search"
                value={filters.search}
                onChange={(event) =>
                  updateFilter("search", event.target.value)
                }
                placeholder="Search by company name, legal name, or description"
                disabled={loading || submitting}
              />
            </div>

            <Select
              label="Country"
              value={filters.countryId}
              onChange={(event) =>
                updateFilter("countryId", event.target.value)
              }
              options={[
                { value: "", label: "All countries" },
                ...countryOptions,
              ]}
              disabled={loading || submitting}
            />

            <Select
              label="Business Type"
              value={filters.businessType}
              onChange={(event) =>
                updateFilter("businessType", event.target.value)
              }
              options={[
                { value: "", label: "All business types" },
                ...businessTypeOptions,
              ]}
              disabled={loading || submitting}
            />

            <Input
              label="Classification"
              value={filters.classification}
              onChange={(event) =>
                updateFilter(
                  "classification",
                  event.target.value,
                )
              }
              placeholder="e.g. NAICS code or classification"
              disabled={loading || submitting}
            />

            <Select
              label="Verification"
              value={filters.verified}
              onChange={(event) =>
                updateFilter("verified", event.target.value)
              }
              options={[
                { value: "", label: "All vendors" },
                {
                  value: "verified",
                  label: "Verified only",
                },
                {
                  value: "unverified",
                  label: "Unverified only",
                },
              ]}
              disabled={loading || submitting}
            />
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={loading || submitting}
              onClick={handleReset}
            >
              Clear Filters
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || submitting}
            >
              {submitting ? "Searching..." : "Search Vendors"}
            </Button>
          </div>
        </div>
      </form>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-tenderhub-navy">
              Vendors
            </h3>

            {!loading && (
              <p className="mt-1 text-sm text-gray-500">
                {vendors.length} vendor
                {vendors.length === 1 ? "" : "s"} found
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-gray-200 bg-white">
            <LoadingSpinner size="md" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white">
            <EmptyState
              title="No vendors found"
              description="Try changing your search terms or filters to find matching vendors."
            />

            <div className="flex justify-center pb-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={submitting}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {vendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onView={onViewVendor}
                showActions={Boolean(onViewVendor)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}