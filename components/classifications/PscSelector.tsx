"use client";

import React, { useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export interface PscOption {
  code: string;
  title: string;
  description?: string | null;
  level?: number | null;
  category?: string | null;
}

export interface PscSelectorProps {
  options?: PscOption[];
  value?: string | string[];
  multiple?: boolean;
  loading?: boolean;
  disabled?: boolean;
  error?: string | null;
  label?: string;
  description?: string;
  placeholder?: string;
  maxSelections?: number;
  onChange?: (value: string | string[]) => void;
  className?: string;
}

export default function PscSelector({
  options = [],
  value = "",
  multiple = false,
  loading = false,
  disabled = false,
  error = null,
  label = "PSC Classification",
  description = "Select the Product and Service Code classifications that apply to the procurement, organization, or vendor.",
  placeholder = "Search PSC codes or products and services...",
  maxSelections,
  onChange,
  className = "",
}: PscSelectorProps) {
  const [search, setSearch] = useState("");

  const selectedCodes = useMemo(() => {
    if (Array.isArray(value)) {
      return value;
    }

    return value ? [value] : [];
  }, [value]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return options;
    }

    return options.filter((option) => {
      const searchableText = [
        option.code,
        option.title,
        option.description ?? "",
        option.category ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [options, search]);

  function isSelected(code: string) {
    return selectedCodes.includes(code);
  }

  function handleSelect(code: string) {
    if (disabled) {
      return;
    }

    if (!multiple) {
      onChange?.(code);
      return;
    }

    if (isSelected(code)) {
      onChange?.(
        selectedCodes.filter(
          (selectedCode) => selectedCode !== code,
        ),
      );
      return;
    }

    if (
      maxSelections !== undefined &&
      selectedCodes.length >= maxSelections
    ) {
      return;
    }

    onChange?.([...selectedCodes, code]);
  }

  function clearSelection() {
    if (disabled) {
      return;
    }

    onChange?.(multiple ? [] : "");
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-semibold text-gray-900">
          {label}
        </label>

        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <Input
            label="Search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>

        {selectedCodes.length > 0 && (
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Selected classifications
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {selectedCodes.length} selected
                  {maxSelections !== undefined
                    ? ` of ${maxSelections}`
                    : ""}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={clearSelection}
              >
                Clear
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCodes.map((code) => {
                const selectedOption = options.find(
                  (option) => option.code === code,
                );

                return (
                  <button
                    key={code}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelect(code)}
                    className="inline-flex items-center gap-2 rounded-full border border-tenderhub-gold/40 bg-tenderhub-gold/10 px-3 py-1.5 text-xs font-medium text-tenderhub-navy transition hover:bg-tenderhub-gold/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{code}</span>

                    {selectedOption?.title && (
                      <span className="max-w-[220px] truncate text-gray-600">
                        {selectedOption.title}
                      </span>
                    )}

                    <span aria-hidden="true">
                      ×
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : filteredOptions.length === 0 ? (
          <div className="px-6 py-10">
            <EmptyState
              title={
                search
                  ? "No classifications found"
                  : "No PSC classifications"
              }
              description={
                search
                  ? "Try a different code, product, service, or keyword."
                  : "There are no PSC classifications available to select."
              }
            />
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            <div className="divide-y divide-gray-200">
              {filteredOptions.map((option) => {
                const selected = isSelected(
                  option.code,
                );

                const maximumReached =
                  multiple &&
                  !selected &&
                  maxSelections !== undefined &&
                  selectedCodes.length >=
                    maxSelections;

                return (
                  <button
                    key={option.code}
                    type="button"
                    disabled={
                      disabled || maximumReached
                    }
                    onClick={() =>
                      handleSelect(option.code)
                    }
                    className={`block w-full px-4 py-4 text-left transition ${
                      selected
                        ? "bg-tenderhub-gold/10"
                        : "hover:bg-gray-50"
                    } ${
                      disabled || maximumReached
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                          selected
                            ? "border-tenderhub-gold bg-tenderhub-gold text-tenderhub-navy"
                            : "border-gray-300 bg-white text-transparent"
                        }`}
                        aria-hidden="true"
                      >
                        ✓
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-tenderhub-navy">
                            {option.code}
                          </span>

                          {option.level !==
                            undefined &&
                            option.level !== null && (
                              <span className="text-xs text-gray-400">
                                Level {option.level}
                              </span>
                            )}

                          {option.category && (
                            <span className="text-xs text-gray-500">
                              {option.category}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {option.title}
                        </p>

                        {option.description && (
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500">
                            {option.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {error && (
        <p
          role="alert"
          className="text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {multiple &&
        maxSelections !== undefined && (
          <p className="text-xs text-gray-500">
            You can select up to {maxSelections}{" "}
            classification
            {maxSelections === 1 ? "" : "s"}.
          </p>
        )}
    </div>
  );
}