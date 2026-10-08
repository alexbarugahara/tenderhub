"use client";

import { useMemo, useState } from "react";
import NewsCard, { type NewsCardData } from "./NewsCard";

export interface NewsListProps {
  articles?: NewsCardData[];
  loading?: boolean;
  error?: string | null;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  categories?: string[];
  onPageChange?: (page: number) => void;
  onOpen?: (article: NewsCardData) => void;
  onRefresh?: () => void;
  className?: string;
}

export default function NewsList({
  articles = [],
  loading = false,
  error = null,
  page = 1,
  pageSize = 9,
  totalPages,
  categories,
  onPageChange,
  onOpen,
  onRefresh,
  className = "",
}: NewsListProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const availableCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return Array.from(new Set(categories)).sort();
    }

    return Array.from(
      new Set(
        articles
          .map((article) => article.category)
          .filter((value): value is string => Boolean(value))
      )
    ).sort();
  }, [articles, categories]);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesSearch =
        query.length === 0 ||
        article.title.toLowerCase().includes(query) ||
        article.excerpt?.toLowerCase().includes(query) ||
        article.content?.toLowerCase().includes(query) ||
        article.category?.toLowerCase().includes(query) ||
        article.author?.toLowerCase().includes(query);

      const matchesCategory =
        category === "ALL" || article.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [articles, category, search]);

  const calculatedTotalPages = Math.max(
    1,
    Math.ceil(articles.length / pageSize)
  );

  const effectiveTotalPages =
    totalPages && totalPages > 0 ? totalPages : calculatedTotalPages;

  function handlePageChange(nextPage: number): void {
    if (
      nextPage < 1 ||
      nextPage > effectiveTotalPages ||
      nextPage === page
    ) {
      return;
    }

    onPageChange?.(nextPage);
  }

  function clearFilters(): void {
    setSearch("");
    setCategory("ALL");
  }

  return (
    <section className={className}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tenderhub-navy">
            Procurement News
          </h1>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Stay informed about procurement, tendering, contracting, and
            TenderHub updates.
          </p>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-tenderhub-navy px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="block">
            <span className="sr-only">Search news</span>

            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-4-4" />
              </svg>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search news..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
              />
            </div>
          </label>

          <label className="block">
            <span className="sr-only">Filter by category</span>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
            >
              <option value="ALL">All categories</option>

              {availableCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {(search || category !== "ALL") && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:border-tenderhub-navy hover:text-tenderhub-navy"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(pageSize, 9) }).map(
            (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="aspect-[16/9] animate-pulse bg-slate-200" />

                <div className="space-y-3 p-5">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-5 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-5 w-4/5 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            )
          )}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3.75h.007v.007H12v-.007Zm9-3.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>

          <h2 className="text-sm font-semibold text-red-800">
            Unable to load news
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-red-700">
            {error}
          </p>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-4 rounded-lg bg-tenderhub-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Try again
            </button>
          )}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 8h10M7 12h10M7 16h6"
              />
            </svg>
          </div>

          <h2 className="text-base font-semibold text-tenderhub-navy">
            {search || category !== "ALL"
              ? "No matching news articles"
              : "No news articles available"}
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            {search || category !== "ALL"
              ? "Try changing your search or category filter."
              : "Published procurement and TenderHub news will appear here."}
          </p>

          {(search || category !== "ALL") && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-tenderhub-navy transition hover:text-tenderhub-gold"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-medium text-slate-700">
                {filteredArticles.length}
              </span>{" "}
              article{filteredArticles.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                onOpen={onOpen}
              />
            ))}
          </div>

          {effectiveTotalPages > 1 && (
            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page {page} of {effectiveTotalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || !onPageChange}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-tenderhub-navy hover:text-tenderhub-navy disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from(
                  { length: effectiveTotalPages },
                  (_, index) => index + 1
                )
                  .filter((pageNumber) => {
                    if (effectiveTotalPages <= 5) {
                      return true;
                    }

                    if (pageNumber === 1) {
                      return true;
                    }

                    if (pageNumber === effectiveTotalPages) {
                      return true;
                    }

                    return Math.abs(pageNumber - page) <= 1;
                  })
                  .map((pageNumber, index, visiblePages) => {
                    const previousPageNumber =
                      visiblePages[index - 1];

                    const needsEllipsis =
                      previousPageNumber !== undefined &&
                      pageNumber - previousPageNumber > 1;

                    return (
                      <span key={pageNumber} className="contents">
                        {needsEllipsis && (
                          <span className="px-1 text-sm text-slate-400">
                            ...
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handlePageChange(pageNumber)}
                          disabled={!onPageChange}
                          aria-current={
                            pageNumber === page ? "page" : undefined
                          }
                          className={`min-w-10 rounded-lg px-3 py-2 text-sm font-medium transition ${
                            pageNumber === page
                              ? "bg-tenderhub-navy text-white"
                              : "border border-slate-300 text-slate-700 hover:border-tenderhub-navy hover:text-tenderhub-navy"
                          } disabled:cursor-not-allowed`}
                        >
                          {pageNumber}
                        </button>
                      </span>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={
                    page >= effectiveTotalPages || !onPageChange
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-tenderhub-navy hover:text-tenderhub-navy disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}