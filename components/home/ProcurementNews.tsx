"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Newspaper,
} from "lucide-react";

interface ProcurementNewsItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content?: string | null;
  image?: string | null;
  published: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

interface ProcurementNewsProps {
  news?: ProcurementNewsItem[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  className?: string;
}

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getExcerpt(item: ProcurementNewsItem) {
  const source = item.summary?.trim() || item.content?.trim() || "";

  if (source.length <= 150) {
    return source;
  }

  return `${source.slice(0, 147).trimEnd()}...`;
}

export default function ProcurementNews({
  news = [],
  title = "Procurement News & Insights",
  description = "Stay informed with procurement updates, platform news, and useful insights for organizations and vendors.",
  viewAllHref = "/news",
  className = "",
}: ProcurementNewsProps) {
  const publishedNews = news.filter((item) => item.published).slice(0, 3);

  return (
    <section className={`bg-tenderhub-background py-16 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-tenderhub-gold">
              <Newspaper className="h-4 w-4" />
              Procurement Insights
            </div>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-tenderhub-navy sm:text-4xl">
              {title}
            </h2>

            <p className="mt-4 text-base leading-7 text-gray-600">
              {description}
            </p>
          </div>

          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-tenderhub-navy transition hover:text-tenderhub-gold"
          >
            View All News
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {publishedNews.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tenderhub-navy/5 text-tenderhub-navy">
              <FileText className="h-6 w-6" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-tenderhub-navy">
              No news available
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Procurement news and insights will appear here when they are
              published.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publishedNews.map((item) => (
              <article
                key={item.id}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {item.image ? (
                  <Link
                    href={`/news/${item.slug}`}
                    className="block aspect-[16/9] overflow-hidden bg-gray-100"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </Link>
                ) : (
                  <Link
                    href={`/news/${item.slug}`}
                    className="flex aspect-[16/9] items-center justify-center bg-tenderhub-navy"
                  >
                    <Newspaper className="h-10 w-10 text-tenderhub-gold" />
                  </Link>
                )}

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <CalendarDays className="h-4 w-4" />
                    <time dateTime={new Date(item.createdAt).toISOString()}>
                      {formatDate(item.createdAt)}
                    </time>
                  </div>

                  <h3 className="mt-4 text-xl font-semibold leading-7 text-tenderhub-navy">
                    <Link
                      href={`/news/${item.slug}`}
                      className="transition hover:text-tenderhub-gold"
                    >
                      {item.title}
                    </Link>
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">
                    {getExcerpt(item)}
                  </p>

                  <Link
                    href={`/news/${item.slug}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-tenderhub-navy transition hover:text-tenderhub-gold"
                  >
                    Read Article
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}