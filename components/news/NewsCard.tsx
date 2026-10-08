"use client";

export interface NewsCardData {
  id: string;
  slug?: string;
  title: string;
  excerpt?: string;
  content?: string;
  imageUrl?: string;
  category?: string;
  author?: string;
  publishedAt?: string | Date;
  createdAt?: string | Date;
  featured?: boolean;
}

export interface NewsCardProps {
  article: NewsCardData;
  onOpen?: (article: NewsCardData) => void;
  href?: string;
  className?: string;
}

function formatNewsDate(value?: string | Date): string {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getExcerpt(article: NewsCardData): string {
  if (article.excerpt?.trim()) {
    return article.excerpt.trim();
  }

  if (article.content?.trim()) {
    const plainText = article.content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (plainText.length > 150) {
      return `${plainText.slice(0, 150).trim()}...`;
    }

    return plainText;
  }

  return "Read the latest procurement and TenderHub news.";
}

export default function NewsCard({
  article,
  onOpen,
  href,
  className = "",
}: NewsCardProps) {
  const articleHref = href ?? (article.slug ? `/news/${article.slug}` : null);
  const publishedDate = formatNewsDate(
    article.publishedAt ?? article.createdAt
  );

  function handleOpen(): void {
    if (onOpen) {
      onOpen(article);
      return;
    }

    if (articleHref) {
      window.location.href = articleHref;
    }
  }

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <button
        type="button"
        onClick={handleOpen}
        className="block w-full text-left"
        aria-label={`Read ${article.title}`}
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-tenderhub-navy">
              <div className="flex flex-col items-center gap-2 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
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
                      d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m7 8 3 3 2-2 5 5"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 16h10"
                    />
                  </svg>
                </div>

                <span className="text-xs font-medium text-white/70">
                  TenderHub News
                </span>
              </div>
            </div>
          )}

          {article.featured && (
            <span className="absolute left-3 top-3 rounded-full bg-tenderhub-gold px-2.5 py-1 text-[11px] font-semibold text-tenderhub-navy shadow-sm">
              Featured
            </span>
          )}

          {article.category && (
            <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-tenderhub-navy shadow-sm">
              {article.category}
            </span>
          )}
        </div>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {publishedDate && <span>{publishedDate}</span>}

          {publishedDate && article.author && (
            <span aria-hidden="true">•</span>
          )}

          {article.author && <span>{article.author}</span>}
        </div>

        <button
          type="button"
          onClick={handleOpen}
          className="mt-2 text-left"
        >
          <h2 className="line-clamp-2 text-lg font-semibold leading-7 text-tenderhub-navy transition group-hover:text-tenderhub-gold">
            {article.title}
          </h2>
        </button>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
          {getExcerpt(article)}
        </p>

        <div className="mt-auto pt-5">
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center gap-2 text-sm font-semibold text-tenderhub-navy transition hover:text-tenderhub-gold"
          >
            Read article

            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m13 6 6 6-6 6"
              />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}