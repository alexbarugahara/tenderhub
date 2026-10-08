"use client";

import React from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export interface SolicitationDocument {
  id: string;
  name: string;
  category: string;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: number | null;
  version?: number | null;
}

export interface SolicitationDocumentsProps {
  documents: SolicitationDocument[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  showCategory?: boolean;
  showVersion?: boolean;
  className?: string;
}

function formatCategory(category: string): string {
  return category
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatFileSize(bytes?: number | null): string | null {
  if (!bytes || bytes <= 0) {
    return null;
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

function getFileExtension(
  fileName: string,
  mimeType?: string | null,
): string {
  const extension = fileName.split(".").pop();

  if (extension && extension !== fileName) {
    return extension.toUpperCase();
  }

  if (mimeType) {
    const mimeMap: Record<string, string> = {
      "application/pdf": "PDF",
      "application/msword": "DOC",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "DOCX",
      "application/vnd.ms-excel": "XLS",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "XLSX",
      "text/csv": "CSV",
      "text/plain": "TXT",
      "application/zip": "ZIP",
    };

    return mimeMap[mimeType] ?? "FILE";
  }

  return "FILE";
}

export default function SolicitationDocuments({
  documents,
  title = "Solicitation Documents",
  description = "Review and download the documents provided for this solicitation.",
  emptyMessage = "No documents have been published for this solicitation.",
  showCategory = true,
  showVersion = true,
  className = "",
}: SolicitationDocumentsProps) {
  return (
    <Card className={className}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-tenderhub-navy">
          {title}
        </h2>

        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
            <svg
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
                d="M7 3.5h7l4 4V20.5H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 3.5v4h4"
              />
            </svg>
          </div>

          <p className="mt-3 text-sm font-medium text-gray-700">
            {emptyMessage}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {documents.map((document) => {
            const fileSize = formatFileSize(document.fileSize);
            const extension = getFileExtension(
              document.name,
              document.mimeType,
            );

            return (
              <div
                key={document.id}
                className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-tenderhub-navy text-xs font-bold text-white">
                    {extension}
                  </div>

                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-semibold text-gray-800"
                      title={document.name}
                    >
                      {document.name}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {showCategory && (
                        <Badge variant="default" size="sm">
                          {formatCategory(document.category)}
                        </Badge>
                      )}

                      {showVersion &&
                        document.version !== null &&
                        document.version !== undefined && (
                          <span className="text-xs text-gray-500">
                            Version {document.version}
                          </span>
                        )}

                      {fileSize && (
                        <span className="text-xs text-gray-500">
                          {fileSize}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Link
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    View Document
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}