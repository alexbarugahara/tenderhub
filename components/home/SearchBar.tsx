"use client";

import { FormEvent, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  showFilters?: boolean;
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  className?: string;
}

export default function SearchBar({
  initialQuery = "",
  placeholder = "Search solicitations, services, vendors, or procurement opportunities...",
  showFilters = false,
  onSearch,
  onFilterClick,
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (onSearch) {
      onSearch(trimmedQuery);
      return;
    }

    if (trimmedQuery) {
      window.location.href = `/solicitations?search=${encodeURIComponent(
        trimmedQuery
      )}`;
      return;
    }

    window.location.href = "/solicitations";
  };

  const handleClear = () => {
    setQuery("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full flex-col gap-2 sm:flex-row ${className}`}
    >
      <div className="flex min-h-12 flex-1 items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-tenderhub-gold focus-within:ring-2 focus-within:ring-tenderhub-gold/20">
        <Search className="mr-3 h-5 w-5 shrink-0 text-slate-400" />

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label="Search procurement opportunities"
          className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />

        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="ml-2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {showFilters && (
          <button
            type="button"
            onClick={onFilterClick}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        )}

        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-tenderhub-navy px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-tenderhub-navy/90"
        >
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>
    </form>
  );
}