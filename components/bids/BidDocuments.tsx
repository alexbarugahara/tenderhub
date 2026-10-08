"use client";

import React, { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export type BidDocumentStatusValue =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface BidDocumentItem {
  id: string;
  bidId: string;
  name: string;
  category: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  status: BidDocumentStatusValue;
  uploadedAt?: Date | string | null;
  reviewedAt?: Date | string | null;
  reviewedById?: string | null;
  rejectionReason?: string | null;
}

export interface BidDocumentsProps {
  bidId: string;
  documents: BidDocumentItem[];
  readOnly?: boolean;
  uploading?: boolean;
  deletingDocumentId?: string | null;
  onUpload?: () => void;
  onDelete?: (document: BidDocumentItem) => void;
  onReview?: (document: BidDocumentItem) => void;
  className?: string;
}

const statusLabels: Record<BidDocumentStatusValue, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const statusVariants: Record<
  BidDocumentStatusValue,
  "default" | "success" | "danger"
> = {
  PENDING: "default",
  APPROVED: "success",
  REJECTED: "danger",
};

function formatDate(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getCategoryLabel(category: string): string {
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function BidDocuments({
  bidId,
  documents,
  readOnly = false,
  uploading = false,
  deletingDocumentId = null,
  onUpload,
  onDelete,
  onReview,
  className = "",
}: BidDocumentsProps) {
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(
    null,
  );

  const bidDocuments = documents.filter(
    (document) => document.bidId === bidId,
  );

  function toggleDocument(documentId: string) {
    setExpandedDocumentId((current) =>
      current === documentId ? null : documentId,
    );
  }

  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Bid Documents
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Documents attached to this bid.
          </p>
        </div>

        {!readOnly && onUpload && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={uploading}
            onClick={onUpload}
          >
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
        )}
      </div>

      <div className="mt-6">
        {bidDocuments.length === 0 ? (
          <EmptyState
            title="No documents"
            description="No documents have been added to this bid yet."
          />
        ) : (
          <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
            {bidDocuments.map((document) => {
              const isExpanded = expandedDocumentId === document.id;
              const isDeleting = deletingDocumentId === document.id;

              return (
                <div key={document.id} className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-sm font-semibold text-tenderhub-navy hover:underline"
                        >
                          {document.name}
                        </a>

                        <Badge
                          variant={statusVariants[document.status]}
                          dot
                        >
                          {statusLabels[document.status]}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>
                          {getCategoryLabel(document.category)}
                        </span>

                        <span>{document.mimeType}</span>

                        <span>
                          {formatFileSize(document.fileSize)}
                        </span>

                        <span>
                          Uploaded {formatDate(document.uploadedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleDocument(document.id)}
                      >
                        {isExpanded ? "Hide Details" : "Details"}
                      </Button>

                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        View
                      </a>

                      {!readOnly && onReview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onReview(document)}
                        >
                          Review
                        </Button>
                      )}

                      {!readOnly && onDelete && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => onDelete(document)}
                        >
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Document ID
                          </dt>
                          <dd className="mt-1 break-all text-sm text-gray-900">
                            {document.id}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Bid ID
                          </dt>
                          <dd className="mt-1 break-all text-sm text-gray-900">
                            {document.bidId}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Category
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {getCategoryLabel(document.category)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            MIME Type
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {document.mimeType}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            File Size
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatFileSize(document.fileSize)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Uploaded At
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(document.uploadedAt)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Reviewed At
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(document.reviewedAt)}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Reviewed By
                          </dt>
                          <dd className="mt-1 break-all text-sm text-gray-900">
                            {document.reviewedById || "—"}
                          </dd>
                        </div>
                      </dl>

                      {document.status === "REJECTED" &&
                        document.rejectionReason && (
                          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                              Rejection Reason
                            </p>

                            <p className="mt-1 text-sm leading-6 text-red-700">
                              {document.rejectionReason}
                            </p>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}