"use client";

import React from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export interface NoticeDetailsData {
  id: string;
  title: string;
  content: string;
  noticeType?: string | null;
  status?: string | null;
  publishedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  solicitationId?: string | null;
  solicitationTitle?: string | null;
  solicitationNumber?: string | null;
}

export interface NoticeDetailsProps {
  notice: NoticeDetailsData;
  canManage?: boolean;
  onBack?: () => void;
  onEdit?: (notice: NoticeDetailsData) => void;
  onDelete?: (
    notice: NoticeDetailsData,
  ) => void | Promise<void>;
  className?: string;
}

function formatDate(
  value?: string | Date | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatus(
  notice: NoticeDetailsData,
): string {
  if (notice.status) {
    return notice.status;
  }

  if (
    notice.expiresAt &&
    new Date(notice.expiresAt) < new Date()
  ) {
    return "EXPIRED";
  }

  if (
    notice.publishedAt &&
    new Date(notice.publishedAt) > new Date()
  ) {
    return "SCHEDULED";
  }

  if (notice.publishedAt) {
    return "PUBLISHED";
  }

  return "DRAFT";
}

function getStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "default" {
  switch (status.toUpperCase()) {
    case "PUBLISHED":
    case "ACTIVE":
      return "success";

    case "SCHEDULED":
    case "PENDING":
      return "warning";

    case "EXPIRED":
    case "CLOSED":
    case "CANCELLED":
      return "danger";

    default:
      return "default";
  }
}

export default function NoticeDetails({
  notice,
  canManage = false,
  onBack,
  onEdit,
  onDelete,
  className = "",
}: NoticeDetailsProps) {
  const status = getStatus(notice);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
          >
            ← Back
          </Button>
        ) : (
          <div />
        )}

        {canManage && (
          <div className="flex flex-wrap gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onEdit(notice)}
              >
                Edit Notice
              </Button>
            )}

            {onDelete && (
              <Button
                type="button"
                variant="danger"
                onClick={() => onDelete(notice)}
              >
                Delete Notice
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <div className="border-b border-gray-200 pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={getStatusVariant(status)}
            >
              {status.replaceAll("_", " ")}
            </Badge>

            {notice.noticeType && (
              <Badge variant="default">
                {notice.noticeType}
              </Badge>
            )}
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-tenderhub-navy">
            {notice.title}
          </h1>

          {notice.solicitationTitle && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Related Solicitation
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {notice.solicitationTitle}
              </p>

              {notice.solicitationNumber && (
                <p className="mt-1 font-mono text-xs text-gray-500">
                  {notice.solicitationNumber}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="py-6">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
              {notice.content}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Published
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatDate(notice.publishedAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Expires
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatDate(notice.expiresAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Created
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatDate(notice.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Last Updated
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatDate(notice.updatedAt)}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}