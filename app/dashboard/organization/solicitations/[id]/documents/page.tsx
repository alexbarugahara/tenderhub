"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import Button from "@/components/ui/Button";
import SolicitationDocumentUpload from "@/components/solicitations/SolicitationDocumentUpload";

interface Solicitation {
  id: string;
  solicitationNumber: string;
  title: string;
  status: string;
}

interface SolicitationDocument {
  id: string;
  solicitationId: string;
  name: string;
  category: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

function formatEnum(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatFileSize(bytes: number | null) {
  if (bytes === null || !Number.isFinite(bytes)) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-UG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getFileExtension(name: string) {
  const parts = name.split(".");

  if (parts.length < 2) {
    return "";
  }

  return parts[parts.length - 1].toUpperCase();
}

export default function SolicitationDocumentsPage() {
  const params = useParams<{ id: string }>();
  const solicitationId = params?.id;

  const [solicitation, setSolicitation] =
    useState<Solicitation | null>(null);

  const [documents, setDocuments] = useState<SolicitationDocument[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [documentsError, setDocumentsError] = useState("");

  const loadSolicitation = useCallback(async () => {
    if (!solicitationId) {
      return;
    }

    try {
      const response = await fetch(
        `/api/solicitations/${solicitationId}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data: ApiResponse<Solicitation> =
        await response.json();

      if (!response.ok || !data.success || !data.data) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to load the solicitation.",
        );
      }

      setSolicitation(data.data);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load the solicitation.",
      );
    } finally {
      setLoading(false);
    }
  }, [solicitationId]);

  const loadDocuments = useCallback(async () => {
    if (!solicitationId) {
      return;
    }

    try {
      setDocumentsLoading(true);
      setDocumentsError("");

      const response = await fetch(
        `/api/solicitation-documents?solicitationId=${encodeURIComponent(
          solicitationId,
        )}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data: ApiResponse<SolicitationDocument[]> =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to load solicitation documents.",
        );
      }

      setDocuments(data.data ?? []);
    } catch (loadError) {
      setDocumentsError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load solicitation documents.",
      );
    } finally {
      setDocumentsLoading(false);
    }
  }, [solicitationId]);

  useEffect(() => {
    if (!solicitationId) {
      return;
    }

    void loadSolicitation();
    void loadDocuments();
  }, [solicitationId, loadSolicitation, loadDocuments]);

  const canUpload = solicitation?.status === "DRAFT";

  const categorySummary = useMemo(() => {
    const counts = new Map<string, number>();

    for (const document of documents) {
      counts.set(
        document.category,
        (counts.get(document.category) ?? 0) + 1,
      );
    }

    return Array.from(counts.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
  }, [documents]);

  if (!solicitationId) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Solicitation ID is missing.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link
                href="/dashboard/organization/solicitations"
                className="transition hover:text-tenderhub-navy"
              >
                Solicitations
              </Link>

              <span>/</span>

              <Link
                href={`/dashboard/organization/solicitations/${solicitationId}`}
                className="transition hover:text-tenderhub-navy"
              >
                {solicitation?.solicitationNumber ||
                  "Solicitation"}
              </Link>

              <span>/</span>

              <span className="text-slate-700">Documents</span>
            </div>

            {loading ? (
              <>
                <div className="h-8 w-72 animate-pulse rounded bg-slate-200" />
                <div className="mt-2 h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />
              </>
            ) : error ? (
              <>
                <h1 className="text-2xl font-bold text-tenderhub-navy">
                  Solicitation Documents
                </h1>

                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-tenderhub-navy">
                    Solicitation Documents
                  </h1>

                  {solicitation?.status && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {formatEnum(solicitation.status)}
                    </span>
                  )}
                </div>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  Manage the documents that belong to{" "}
                  <span className="font-semibold text-slate-800">
                    {solicitation?.solicitationNumber}
                  </span>
                  {solicitation?.title
                    ? ` — ${solicitation.title}`
                    : ""}
                  .
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/organization/solicitations/${solicitationId}`}
            >
              <Button type="button" variant="outline">
                Back to Solicitation
              </Button>
            </Link>
          </div>
        </div>

        {solicitation && solicitation.status !== "DRAFT" && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="font-semibold text-amber-900">
              Document uploads are closed
            </div>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              Documents can only be added while this solicitation is
              in draft status. Existing documents remain available
              below.
            </p>
          </div>
        )}

        {canUpload && solicitation && (
          <SolicitationDocumentUpload
            solicitationId={solicitation.id}
            onUploaded={loadDocuments}
          />
        )}

        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-tenderhub-navy">
                Uploaded Documents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Documents currently registered against this
                solicitation.
              </p>
            </div>

            {!documentsLoading && (
              <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">
                {documents.length}{" "}
                {documents.length === 1 ? "document" : "documents"}
              </div>
            )}
          </div>

          {documentsError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {documentsError}
            </div>
          )}

          {documentsLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="h-5 w-3/4 rounded bg-slate-200" />
                  <div className="mt-3 h-4 w-1/2 rounded bg-slate-200" />
                  <div className="mt-5 h-16 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                📄
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No documents uploaded
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {canUpload
                  ? "Upload the solicitation documents, technical materials, financial documents, work plans, methodologies, or other supporting files for this procurement."
                  : "There are currently no documents registered against this solicitation."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {documents.map((document) => {
                  const extension = getFileExtension(
                    document.name,
                  );

                  return (
                    <article
                      key={document.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="break-words text-base font-semibold text-slate-900">
                            {document.name}
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-tenderhub-navy/10 px-2.5 py-1 text-xs font-semibold text-tenderhub-navy">
                              {formatEnum(document.category)}
                            </span>

                            {extension && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {extension}
                              </span>
                            )}

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              v{document.version}
                            </span>
                          </div>
                        </div>
                      </div>

                      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            File Size
                          </dt>

                          <dd className="mt-1 text-sm font-medium text-slate-700">
                            {formatFileSize(document.fileSize)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Uploaded
                          </dt>

                          <dd className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(document.createdAt)}
                          </dd>
                        </div>
                      </dl>

                      {document.mimeType && (
                        <p className="mt-4 truncate text-xs text-slate-400">
                          {document.mimeType}
                        </p>
                      )}

                      <div className="mt-5 flex justify-end">
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-lg border border-tenderhub-navy px-4 py-2 text-sm font-semibold text-tenderhub-navy transition hover:bg-tenderhub-navy hover:text-white"
                        >
                          View Document
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>

              {categorySummary.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-tenderhub-navy">
                    Document Summary
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {categorySummary.map(([category, count]) => (
                      <div
                        key={category}
                        className="rounded-lg bg-slate-50 px-4 py-3"
                      >
                        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          {formatEnum(category)}
                        </div>

                        <div className="mt-1 text-lg font-semibold text-slate-800">
                          {count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}