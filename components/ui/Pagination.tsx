"use client";

import React from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className = "",
}: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);

  const safeCurrentPage = Math.min(
    Math.max(currentPage, 1),
    safeTotalPages,
  );

  if (totalPages <= 1) {
    return null;
  }

  const getPages = (): Array<number | "..."> => {
    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1,
      );
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (safeCurrentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pages = getPages();

  const buttonBase =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-tenderhub-gold/30 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <nav
      aria-label="Pagination"
      className={`flex items-center justify-between gap-4 ${className}`}
    >
      <button
        type="button"
        onClick={() => onPageChange(safeCurrentPage - 1)}
        disabled={disabled || safeCurrentPage === 1}
        className={`${buttonBase} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
      >
        Previous
      </button>

      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 min-w-9 items-center justify-center px-2 text-sm text-gray-500"
              >
                ...
              </span>
            );
          }

          const isActive = page === safeCurrentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              disabled={disabled}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? `${buttonBase} border-tenderhub-navy bg-tenderhub-navy text-white`
                  : `${buttonBase} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`
              }
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(safeCurrentPage + 1)}
        disabled={disabled || safeCurrentPage === totalPages}
        className={`${buttonBase} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
      >
        Next
      </button>
    </nav>
  );
}
