"use client";

import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export interface NoticeListItem {
  id: string;
  title: string;
  content: string;
  noticeType?: string | null;
  publishedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  solicitationId?: string | null;
  solicitationTitle?: string | null;
  createdAt?: string | Date | null;
  status?: string | null;
}

export interface NoticeListProps {
  notices?: NoticeListItem[];
  loading?: boolean;
  error?: string | null;
  canManage?: boolean;
  onView?: (notice: NoticeListItem) => void;
  onEdit?: (notice: NoticeListItem) => void;
  onDelete?: (
    notice: NoticeListItem,
  ) => void | Promise<void>;
  onCreate?: () => void;
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

function getNoticeStatus(
  notice: NoticeListItem,
): "Published" | "Scheduled" | "Expired" | "Draft" {
  const now = new Date();

  if (notice.status) {
    const normalized = notice.status.toUpperCase();

    if (
      normalized === "DRAFT" ||
      normalized === "PENDING"
    ) {
      return "Draft";
    }

    if (
      normalized === "EXPIRED" ||
      normalized === "CLOSED"
    ) {
      return "Expired";
    }

    if (
      normalized === "PUBLISHED" ||
      normalized === "ACTIVE"
    ) {
      if (
        notice.expiresAt &&
        new Date(notice.expiresAt) < now
      ) {
        return "Expired";
      }

      if (
        notice.publishedAt &&
        new Date(notice.publishedAt) > now
      ) {
        return "Scheduled";
      }

      return "Published";
    }
  }

  if (
    notice.expiresAt &&
    new Date(notice.expiresAt) < now
  ) {
    return "Expired";
  }

  if (
    notice.publishedAt &&
    new Date(notice.publishedAt) > now
  ) {
    return "Scheduled";
  }

  if (notice.publishedAt) {
    return "Published";
  }

  return "Draft";
}

function getStatusVariant(
  status: ReturnType<typeof getNoticeStatus>,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "Published":
      return "success";
    case "Scheduled":
      return "warning";
    case "Expired":
      return "danger";
    default:
      return "default";
  }
}

export default function NoticeList({
  notices = [],
  loading = false,
  error = null,
  canManage = false,
  onView,
  onEdit,
  onDelete,
  onCreate,
  className = "",
}: NoticeListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [typeFilter, setTypeFilter] =
    useState("ALL");

  const noticeTypes = useMemo(() => {
    const types = notices
      .map((notice) => notice.noticeType)
      .filter(
        (
          type,
        ): type is string =>
          Boolean(type?.trim()),
      );

    return Array.from(new Set(types)).sort();
  }, [notices]);

  const filteredNotices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notices.filter((notice) => {
      const status = getNoticeStatus(notice);

      const matchesSearch =
        !query ||
        [
          notice.title,
          notice.content,
          notice.noticeType ?? "",
          notice.solicitationTitle ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter;

      const matchesType =
        typeFilter === "ALL" ||
        notice.noticeType === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    notices,
    search,
    statusFilter,
    typeFilter,
  ]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Notices
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              View and manage procurement notices.
            </p>
          </div>

          {canManage && onCreate && (
            <Button
              type="button"
              variant="primary"
              onClick={onCreate}
            >
              Create Notice
            </Button>
          )}
        </div>

        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_180px_220px_auto] lg:items-end">
            <Input
              label="Search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search notices..."
            />

            <div>
              <label
                htmlFor="notice-status-filter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="notice-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value,
                  )
                }
                className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
              >
                <option value="ALL">
                  All statuses
                </option>
                <option value="Published">
                  Published
                </option>
                <option value="Scheduled">
                  Scheduled
                </option>
                <option value="Draft">
                  Draft
                </option>
                <option value="Expired">
                  Expired
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="notice-type-filter"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Notice Type
              </label>

              <select
                id="notice-type-filter"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value,
                  )
                }
                className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
              >
                <option value="ALL">
                  All notice types
                </option>

                {noticeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={
                !search &&
                statusFilter === "ALL" &&
                typeFilter === "ALL"
              }
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="border-b border-gray-200 px-6 py-3">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {filteredNotices.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-700">
              {notices.length}
            </span>{" "}
            notices
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="px-6 py-12">
            <EmptyState
              title={
                notices.length === 0
                  ? "No notices"
                  : "No matching notices"
              }
              description={
                notices.length === 0
                  ? "There are no procurement notices to display."
                  : "Try changing your search or filters."
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotices.map((notice) => {
              const status =
                getNoticeStatus(notice);

              return (
                <div
                  key={notice.id}
                  className="px-6 py-5 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {notice.title}
                        </h3>

                        <Badge
                          variant={getStatusVariant(
                            status,
                          )}
                        >
                          {status}
                        </Badge>

                        {notice.noticeType && (
                          <Badge variant="default">
                            {notice.noticeType}
                          </Badge>
                        )}
                      </div>

                      {notice.solicitationTitle && (
                        <p className="mt-2 text-sm text-gray-600">
                          Solicitation:{" "}
                          <span className="font-medium text-gray-800">
                            {
                              notice.solicitationTitle
                            }
                          </span>
                        </p>
                      )}

                      <p className="mt-3 line-clamp-3 max-w-4xl text-sm leading-6 text-gray-600">
                        {notice.content}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
                        <span>
                          Published:{" "}
                          <span className="font-medium text-gray-700">
                            {formatDate(
                              notice.publishedAt,
                            )}
                          </span>
                        </span>

                        <span>
                          Expires:{" "}
                          <span className="font-medium text-gray-700">
                            {formatDate(
                              notice.expiresAt,
                            )}
                          </span>
                        </span>

                        {notice.createdAt && (
                          <span>
                            Created:{" "}
                            <span className="font-medium text-gray-700">
                              {formatDate(
                                notice.createdAt,
                              )}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    {(onView ||
                      (canManage && onEdit) ||
                      (canManage && onDelete)) && (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {onView && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onView(notice)
                            }
                          >
                            View
                          </Button>
                        )}

                        {canManage && onEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onEdit(notice)
                            }
                          >
                            Edit
                          </Button>
                        )}

                        {canManage && onDelete && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              onDelete(notice)
                            }
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}