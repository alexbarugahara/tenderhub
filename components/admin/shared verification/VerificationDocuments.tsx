"use client";

import {
  CheckCircle2,
  Download,
  FileText,
  XCircle,
} from "lucide-react";

import type { VerificationDocument } from "./types";
import {
  documentStatusClass,
  formatCategory,
  formatDate,
  formatFileSize,
  formatStatus,
} from "./utils";

interface VerificationDocumentsProps {
  documents: VerificationDocument[];
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${documentStatusClass(
        status,
      )}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function DocumentCard({
  document,
}: {
  document: VerificationDocument;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-tenderhub-navy">
            <FileText className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="break-words text-sm font-semibold text-gray-900">
              {document.name}
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              {formatCategory(document.category)}
            </p>
          </div>
        </div>

        <StatusBadge status={document.status} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Uploaded
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {formatDate(document.uploadedAt, true)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            File Size
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {formatFileSize(document.fileSize)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Expiry
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {formatDate(document.expiryDate)}
          </p>
        </div>
      </div>

      {document.rejectionReason && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

          <div>
            <p className="text-xs font-semibold text-red-800">
              Rejection reason
            </p>

            <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
              {document.rejectionReason}
            </p>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {document.fileUrl && (
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            View Document
          </a>
        )}

        {document.status === "APPROVED" && (
          <span className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Approved
          </span>
        )}
      </div>
    </div>
  );
}

export default function VerificationDocuments({
  documents,
}: VerificationDocumentsProps) {
  if (!documents.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
          <FileText className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-gray-900">
          No documents uploaded
        </h3>

        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          No verification documents have been uploaded for this entity yet.
        </p>
      </div>
    );
  }

  const approvedCount = documents.filter(
    (document) => document.status === "APPROVED",
  ).length;

  const pendingCount = documents.filter(
    (document) => document.status === "PENDING",
  ).length;

  const rejectedCount = documents.filter(
    (document) => document.status === "REJECTED",
  ).length;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-tenderhub-navy">
              Verification Documents
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Documents submitted as evidence for the verification process.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-700">
              {documents.length} Total
            </span>

            <span className="rounded-full bg-green-50 px-3 py-1.5 font-medium text-green-700">
              {approvedCount} Approved
            </span>

            <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
              {pendingCount} Pending
            </span>

            {rejectedCount > 0 && (
              <span className="rounded-full bg-red-50 px-3 py-1.5 font-medium text-red-700">
                {rejectedCount} Rejected
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
          />
        ))}
      </div>
    </div>
  );
}