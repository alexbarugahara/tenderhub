"use client";

import React, {
  ChangeEvent,
  useRef,
  useState,
} from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export type VendorDocumentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "UNDER_REVIEW"
  | "ACTIVE"
  | string;

export interface VendorDocumentData {
  id: string;
  name: string;
  category: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;

  status?: VendorDocumentStatus;

  uploadedAt?: string | Date;

  /*
   * Retained for compatibility with older callers.
   *
   * The current VendorDocument model does not use
   * reviewedAt as its primary review timestamp.
   * VendorCompliance.checkedAt is the canonical
   * compliance review timestamp.
   */
  reviewedAt?: string | Date;

  rejectionReason?: string | null;

  /*
   * New onboarding evidence relationship.
   *
   * A document may be linked to a VendorCompliance
   * record through documentId.
   */
  requirementId?: string | null;
  requirementCode?: string | null;
  requirementName?: string | null;

  /*
   * Whether this document is currently linked to
   * a compliance requirement.
   */
  linkedToRequirement?: boolean;

  /*
   * Compliance review state associated with the
   * evidence.
   */
  complianceStatus?: string | null;

  /*
   * Compliance review metadata.
   */
  checkedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  reviewNotes?: string | null;
}

export interface VendorDocumentCategoryOption {
  value: string;
  label: string;
}

export interface VendorDocumentsProps {
  documents?: VendorDocumentData[];

  categoryOptions?: VendorDocumentCategoryOption[];

  loading?: boolean;
  uploading?: boolean;

  canUpload?: boolean;

  acceptedFileTypes?: string;
  maxFileSizeMb?: number;

  error?: string | null;

  onUpload?: (
    file: File,
    category: string,
  ) => void | Promise<void>;

  onView?: (
    document: VendorDocumentData,
  ) => void;

  onDownload?: (
    document: VendorDocumentData,
  ) => void;

  onDelete?: (
    document: VendorDocumentData,
  ) => void | Promise<void>;

  className?: string;
}

function formatFileSize(
  bytes: number,
): string {
  if (
    !Number.isFinite(bytes) ||
    bytes < 0
  ) {
    return "Unknown size";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes =
    bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  const megabytes =
    kilobytes / 1024;

  if (megabytes < 1024) {
    return `${megabytes.toFixed(1)} MB`;
  }

  const gigabytes =
    megabytes / 1024;

  return `${gigabytes.toFixed(1)} GB`;
}

function formatDate(
  value?: string | Date | null,
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  ).format(date);
}

function formatStatus(
  status?: string | null,
): string {
  if (!status) {
    return "Uploaded";
  }

  return status
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function getStatusVariant(
  status?: string | null,
):
  | "success"
  | "warning"
  | "danger"
  | "default" {
  const normalized =
    status?.toUpperCase();

  if (
    normalized === "APPROVED" ||
    normalized === "COMPLIANT" ||
    normalized === "ACTIVE"
  ) {
    return "success";
  }

  if (
    normalized === "PENDING" ||
    normalized === "UNDER_REVIEW" ||
    normalized === "REVIEW" ||
    normalized === "EXPIRING"
  ) {
    return "warning";
  }

  if (
    normalized === "REJECTED" ||
    normalized === "EXPIRED" ||
    normalized === "NON_COMPLIANT"
  ) {
    return "danger";
  }

  return "default";
}

function getComplianceLabel(
  document: VendorDocumentData,
): string {
  const status =
    document.complianceStatus?.toUpperCase();

  if (
    status === "COMPLIANT"
  ) {
    return "Requirement approved";
  }

  if (
    status === "NON_COMPLIANT"
  ) {
    return "Requirement not satisfied";
  }

  if (
    status === "EXPIRED"
  ) {
    return "Evidence expired";
  }

  if (
    status === "EXPIRING"
  ) {
    return "Evidence expiring";
  }

  if (
    status === "NOT_APPLICABLE"
  ) {
    return "Requirement not applicable";
  }

  if (
    document.requirementId ||
    document.linkedToRequirement
  ) {
    return "Evidence received · Pending review";
  }

  return "Document uploaded";
}

export default function VendorDocuments({
  documents = [],
  categoryOptions = [],
  loading = false,
  uploading = false,
  canUpload = true,
  acceptedFileTypes,
  maxFileSizeMb = 10,
  error = null,
  onUpload,
  onView,
  onDownload,
  onDelete,
  className = "",
}: VendorDocumentsProps) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("");

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(null);

  const [
    uploadError,
    setUploadError,
  ] = useState<string | null>(
    null,
  );

  const categoryLabel = (
    value: string,
  ): string => {
    const option =
      categoryOptions.find(
        (item) =>
          item.value === value,
      );

    return (
      option?.label ?? value
    );
  };

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    setUploadError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (maxFileSizeMb > 0) {
      const maxBytes =
        maxFileSizeMb *
        1024 *
        1024;

      if (
        file.size >
        maxBytes
      ) {
        setSelectedFile(null);

        setUploadError(
          `The selected file exceeds the ${maxFileSizeMb} MB file size limit.`,
        );

        event.target.value =
          "";

        return;
      }
    }

    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setUploadError(
        "Please select a document to upload.",
      );

      return;
    }

    if (!selectedCategory) {
      setUploadError(
        "Please select a document category.",
      );

      return;
    }

    if (!onUpload) {
      return;
    }

    setUploadError(null);

    try {
      await onUpload(
        selectedFile,
        selectedCategory,
      );

      setSelectedFile(null);
      setSelectedCategory("");

      if (fileInputRef.current) {
        fileInputRef.current.value =
          "";
      }
    } catch (
      uploadException
    ) {
      const message =
        uploadException instanceof
        Error
          ? uploadException.message
          : "The document could not be uploaded.";

      setUploadError(message);
    }
  }

  function handleSelectFile() {
    fileInputRef.current?.click();
  }

  return (
    <div
      className={`space-y-6 ${className}`}
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* UPLOAD EVIDENCE                                    */}
      {/* -------------------------------------------------- */}

      {canUpload && (
        <Card className="p-6">
          <div className="mb-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-tenderhub-navy">
                Submit Supporting Evidence
              </h2>

              <Badge variant="default">
                Vendor Onboarding
              </Badge>
            </div>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
              Upload company documents that support
              your TenderHub onboarding requirements.
              Submitted evidence is recorded as
              received and remains pending until
              reviewed by TenderHub.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Category */}
            <div>
              <label
                htmlFor="vendor-document-category"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Evidence Category
              </label>

              <select
                id="vendor-document-category"
                value={
                  selectedCategory
                }
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value,
                  )
                }
                disabled={
                  uploading
                }
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  Select evidence category
                </option>

                {categoryOptions.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* File */}
            <div>
              <label
                htmlFor="vendor-document-file"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Evidence File
              </label>

              <input
                ref={
                  fileInputRef
                }
                id="vendor-document-file"
                type="file"
                accept={
                  acceptedFileTypes
                }
                onChange={
                  handleFileChange
                }
                disabled={
                  uploading
                }
                className="sr-only"
              />

              <button
                type="button"
                onClick={
                  handleSelectFile
                }
                disabled={
                  uploading
                }
                className="flex min-h-[44px] w-full items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-left transition hover:border-tenderhub-gold hover:bg-tenderhub-gold/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="min-w-0">
                  {selectedFile ? (
                    <>
                      <span className="block truncate text-sm font-medium text-gray-900">
                        {
                          selectedFile.name
                        }
                      </span>

                      <span className="mt-0.5 block text-xs text-gray-500">
                        {formatFileSize(
                          selectedFile.size,
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Choose a supporting document
                    </span>
                  )}
                </span>

                <span className="ml-3 shrink-0 text-sm font-medium text-tenderhub-navy">
                  Browse
                </span>
              </button>
            </div>
          </div>

          {selectedCategory && (
            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Selected Evidence Type
              </p>

              <p className="mt-1 text-sm font-medium text-blue-900">
                {categoryLabel(
                  selectedCategory,
                )}
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-800">
                The evidence will remain pending
                until an authorized TenderHub
                administrator reviews the associated
                requirement.
              </p>
            </div>
          )}

          {uploadError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {uploadError}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-gray-500">
              Maximum file size:{" "}
              {maxFileSizeMb} MB
              {acceptedFileTypes
                ? ` · Accepted: ${acceptedFileTypes}`
                : ""}
            </p>

            <Button
              type="button"
              variant="primary"
              disabled={
                uploading ||
                !selectedFile ||
                !selectedCategory ||
                !onUpload
              }
              onClick={
                handleUpload
              }
            >
              {uploading
                ? "Submitting Evidence..."
                : "Submit Evidence"}
            </Button>
          </div>
        </Card>
      )}

      {/* -------------------------------------------------- */}
      {/* DOCUMENT RECORD                                    */}
      {/* -------------------------------------------------- */}

      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-tenderhub-navy">
                  Supporting Evidence
                </h2>

                <Badge variant="default">
                  {documents.length}
                </Badge>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Evidence submitted by the vendor
                and its current review state.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : documents.length === 0 ? (
          <div className="px-6 py-10">
            <EmptyState
              title="No supporting evidence"
              description="No vendor documents have been submitted for onboarding yet."
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map(
              (document) => {
                const complianceStatus =
                  document.complianceStatus?.toUpperCase();

                const evidencePending =
                  Boolean(
                    document.requirementId,
                  ) &&
                  (!complianceStatus ||
                    complianceStatus ===
                      "PENDING");

                return (
                  <div
                    key={
                      document.id
                    }
                    className="px-6 py-5 transition hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-gray-900">
                            {
                              document.name
                            }
                          </h3>

                          {document.status && (
                            <Badge
                              variant={getStatusVariant(
                                document.status,
                              )}
                            >
                              {formatStatus(
                                document.status,
                              )}
                            </Badge>
                          )}
                        </div>

                        {/* Requirement relationship */}
                        {document.requirementName ||
                        document.requirementId ? (
                          <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Onboarding Requirement
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {document.requirementName ||
                                "Linked onboarding requirement"}
                            </p>

                            {document.requirementCode && (
                              <p className="mt-1 text-xs text-gray-500">
                                Code:{" "}
                                {
                                  document.requirementCode
                                }
                              </p>
                            )}

                            <p className="mt-2 text-xs font-medium text-amber-700">
                              {getComplianceLabel(
                                document,
                              )}
                            </p>
                          </div>
                        ) : (
                          <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Evidence Relationship
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                              This document is not
                              currently linked to a
                              TenderHub onboarding
                              requirement.
                            </p>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                          <span>
                            Category:{" "}
                            <span className="font-medium text-gray-700">
                              {categoryLabel(
                                document.category,
                              )}
                            </span>
                          </span>

                          <span>
                            Size:{" "}
                            <span className="font-medium text-gray-700">
                              {formatFileSize(
                                document.fileSize,
                              )}
                            </span>
                          </span>

                          <span>
                            Uploaded:{" "}
                            <span className="font-medium text-gray-700">
                              {formatDate(
                                document.uploadedAt,
                              )}
                            </span>
                          </span>

                          {document.checkedAt && (
                            <span>
                              Reviewed:{" "}
                              <span className="font-medium text-gray-700">
                                {formatDate(
                                  document.checkedAt,
                                )}
                              </span>
                            </span>
                          )}

                          {document.expiresAt && (
                            <span>
                              Evidence expires:{" "}
                              <span className="font-medium text-gray-700">
                                {formatDate(
                                  document.expiresAt,
                                )}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Pending review notice */}
                        {evidencePending && (
                          <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                            <p className="text-sm font-medium text-amber-900">
                              Evidence received —
                              pending TenderHub
                              review
                            </p>

                            <p className="mt-1 text-xs leading-5 text-amber-800">
                              Uploading this document
                              does not automatically
                              satisfy the requirement.
                              An authorized administrator
                              must review the evidence.
                            </p>
                          </div>
                        )}

                        {/* Review notes */}
                        {document.reviewNotes && (
                          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Review Notes
                            </p>

                            <p className="mt-1 text-sm leading-6 text-gray-700">
                              {
                                document.reviewNotes
                              }
                            </p>
                          </div>
                        )}

                        {/* Rejection */}
                        {document.rejectionReason && (
                          <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                              Rejection Reason
                            </p>

                            <p className="mt-1 text-sm leading-6 text-red-800">
                              {
                                document.rejectionReason
                              }
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {onView && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onView(
                                document,
                              )
                            }
                          >
                            View
                          </Button>
                        )}

                        {onDownload && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onDownload(
                                document,
                              )
                            }
                          >
                            Download
                          </Button>
                        )}

                        {onDelete && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              onDelete(
                                document,
                              )
                            }
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </Card>

      {/* -------------------------------------------------- */}
      {/* WORKFLOW NOTE                                      */}
      {/* -------------------------------------------------- */}

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold text-blue-900">
          Evidence review
        </p>

        <p className="mt-1 text-sm leading-6 text-blue-800">
          A document being uploaded means that
          TenderHub has received the evidence. It does
          not mean the underlying requirement has been
          approved. The requirement remains pending
          until an authorized administrator completes
          the review.
        </p>
      </div>
    </div>
  );
}