"use client";

import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export type ClassificationType =
  | "NAICS"
  | "PSC"
  | "UNSPSC"
  | "CUSTOM";

export interface ClassificationSearchResult {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  type: ClassificationType;
  category?: string | null;
  level?: number | null;
  active?: boolean;
}

export interface ClassificationSearchProps {
  results?: ClassificationSearchResult[];
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  types?: ClassificationType[];
  defaultType?: ClassificationType;
  placeholder?: string;
  label?: string;
  description?: string;
  pageSize?: number;
  onSearch?: (
    query: string,
    type: ClassificationType,
  ) => void | Promise<void>;
  onSelect?: (
    classification: ClassificationSearchResult,
  ) => void;
  className?: string;
}

const classificationLabels: Record<
  ClassificationType,
  string
> = {
  NAICS: "NAICS",
  PSC: "PSC",
  UNSPSC: "UNSPSC",
  CUSTOM: "Custom",
};

export default function ClassificationSearch({
  results = [],
  loading = false,
  disabled = false,
  error = null,
  types = ["NAICS", "PSC", "UNSPSC", "CUSTOM"],
  defaultType = "NAICS",
  placeholder = "Search by code, name, or keyword...",
  label = "Classification Search",
  description = "Search available procurement and business classifications.",
  pageSize = 10,
  onSearch,
  onSelect,
  className = "",
}: ClassificationSearchProps) {
  const [query, setQuery] = useState("");
  const [type, setType] =
    useState<ClassificationType>(
      types.includes(defaultType)
        ? defaultType
        : types[0] ?? "NAICS",
    );
  const [visibleCount, setVisibleCount] =
    useState(pageSize);

  const visibleResults = useMemo(
    () => results.slice(0, visibleCount),
    [results, visibleCount],
  );

  const hasMoreResults =
    visibleCount < results.length;

  async function handleSearch(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (disabled || loading || !onSearch) {
      return;
    }

    setVisibleCount(pageSize);
    await onSearch(query.trim(), type);
  }

  async function handleTypeChange(
    nextType: ClassificationType,
  ) {
    setType(nextType);
    setVisibleCount(pageSize);

    if (
      onSearch &&
      query.trim() &&
      !disabled &&
      !loading
    ) {
      await onSearch(query.trim(), nextType);
    }
  }

  function handleClear() {
    setQuery("");
    setVisibleCount(pageSize);
  }

  return (
    <div className={`space-y-5 ${className}`}>
      <div>
        <h2 className="text-lg font-semibold text-tenderhub-navy">
          {label}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>

      <Card className="overflow-hidden">
        <form
          onSubmit={handleSearch}
          className="border-b border-gray-200 p-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <Input
                label="Search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder={placeholder}
                disabled={disabled || loading}
              />
            </div>

            <div className="w-full lg:w-52">
              <label
                htmlFor="classification-type"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Classification Type
              </label>

              <select
                id="classification-type"
                value={type}
                onChange={(event) =>
                  void handleTypeChange(
                    event.target
                      .value as ClassificationType,
                  )
                }
                disabled={
                  disabled || loading
                }
                className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {types.map((classificationType) => (
                  <option
                    key={classificationType}
                    value={classificationType}
                  >
                    {
                      classificationLabels[
                        classificationType
                      ]
                    }
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={disabled || loading}
              >
                {loading ? "Searching..." : "Search"}
              </Button>

              {query && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || loading}
                  onClick={handleClear}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : results.length === 0 ? (
          <div className="px-6 py-10">
            <EmptyState
              title={
                query
                  ? "No classifications found"
                  : "Start a classification search"
              }
              description={
                query
                  ? `No ${classificationLabels[type]} classifications matched your search.`
                  : "Enter a classification code, name, or keyword to find relevant classifications."
              }
            />
          </div>
        ) : (
          <>
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">
                  {results.length}{" "}
                  {results.length === 1
                    ? "result"
                    : "results"}{" "}
                  found
                </p>

                <Badge variant="default">
                  {classificationLabels[type]}
                </Badge>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {visibleResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect?.(result)}
                  className="block w-full px-4 py-5 text-left transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-tenderhub-navy">
                          {result.code}
                        </span>

                        <Badge variant="default">
                          {
                            classificationLabels[
                              result.type
                            ]
                          }
                        </Badge>

                        {result.level !==
                          undefined &&
                          result.level !== null && (
                            <span className="text-xs text-gray-400">
                              Level {result.level}
                            </span>
                          )}

                        {result.active === false && (
                          <Badge variant="warning">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      <h3 className="mt-2 text-sm font-semibold text-gray-900">
                        {result.name}
                      </h3>

                      {result.description && (
                        <p className="mt-1 max-w-3xl text-sm leading-5 text-gray-500">
                          {result.description}
                        </p>
                      )}

                      {result.category && (
                        <p className="mt-2 text-xs text-gray-500">
                          Category:{" "}
                          <span className="font-medium text-gray-700">
                            {result.category}
                          </span>
                        </p>
                      )}
                    </div>

                    {onSelect && (
                      <span className="shrink-0 text-sm font-medium text-tenderhub-navy">
                        Select →
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {hasMoreResults && (
              <div className="border-t border-gray-200 px-4 py-4 text-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setVisibleCount(
                      (current) =>
                        current + pageSize,
                    )
                  }
                  disabled={disabled}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}