"use client";

import React from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export type ContractDocumentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface ContractDocumentItem {
  id: string;
  contractId: string;
  name: string;
  category: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: number | null;
  status: ContractDocumentStatus;
  uploadedAt?: Date | string | null;
  reviewedAt?: Date | string | null;
  reviewedById?: string | null;
  rejectionReason?: string | null;
}

export interface ContractDocumentsProps {
  documents: ContractDocumentItem[];
  readOnly?: boolean;
  uploading?: boolean;
  deletingDocumentId?: string | null;
  onUpload?: (file: File) => void | Promise<void>;
  onDelete?: (document: ContractDocumentItem) => void | Promise<void>;
  className?: string;
}

const statusLabels: Record<ContractDocumentStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const statusVariants: Record<
  ContractDocumentStatus,
  "default" | "success" | "danger"
> = {
  PENDING: "default",
  APPROVED: "success",
  REJECTED: "danger",
};

function formatDate(
  value: Date | string | null | undefined,
): string {
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

function formatFileSize(
  fileSize?: number | null,
): string {
  if (
    fileSize === null ||
    fileSize === undefined ||
    !Number.isFinite(fileSize)
  ) {
    return "—";
  }

  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(1)} KB`;
  }

  if (fileSize < 1024 * 1024 * 1024) {
    return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(fileSize / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function ContractDocuments({
  documents,
  readOnly = false,
  uploading = false,
  deletingDocumentId = null,
  onUpload,
  onDelete,
  className = "",
}: ContractDocumentsProps) {
  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file || !onUpload) {
      return;
    }

    void onUpload(file);
    event.target.value = "";
  }

  return (
    <Card className={className}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Contract Documents
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage documents associated with this contract.
            </p>
          </div>

          {!readOnly && onUpload && (
            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90">
              {uploading ? "Uploading..." : "Upload Document"}

              <input
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center">
            <p className="text-sm font-medium text-gray-700">
              No contract documents have been uploaded.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Upload agreements, supporting documents, and other
              contract records here.
            </p>

            {!readOnly && onUpload && (
              <label className="mt-4 inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                {uploading
                  ? "Uploading..."
                  : "Upload First Document"}

                <input
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 2v6h6M8 13h8M8 17h6"
                      />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm font-semibold text-tenderhub-navy hover:underline"
                    >
                      {document.name}
                    </a>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span>{document.category}</span>

                      <span>{formatFileSize(document.fileSize)}</span>

                      {document.mimeType && (
                        <span>{document.mimeType}</span>
                      )}

                      <span>
                        Uploaded {formatDate(document.uploadedAt)}
                      </span>
                    </div>

                    {document.rejectionReason && (
                      <p className="mt-2 text-xs text-red-600">
                        Rejection reason:{" "}
                        {document.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge
                    variant={statusVariants[document.status]}
                  >
                    {statusLabels[document.status]}
                  </Badge>

                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    View
                  </a>

                  {!readOnly && onDelete && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={
                        deletingDocumentId === document.id
                      }
                      onClick={() => void onDelete(document)}
                    >
                      {deletingDocumentId === document.id
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
