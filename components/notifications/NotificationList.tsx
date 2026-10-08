"use client";

import { useMemo, useState } from "react";

export type NotificationListType = string;

export interface NotificationListItem {
  id: string;
  title?: string;
  message?: string;
  content?: string;
  type?: NotificationListType;
  read?: boolean;
  createdAt: string | Date;
  link?: string;
  url?: string;
}

export interface NotificationListProps {
  notifications?: NotificationListItem[];
  loading?: boolean;
  error?: string | null;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onOpen?: (notification: NotificationListItem) => void;
  onMarkRead?: (notification: NotificationListItem) => void;
  onMarkUnread?: (notification: NotificationListItem) => void;
  onMarkAllRead?: () => void;
  onDelete?: (notification: NotificationListItem) => void;
  onRefresh?: () => void;
  className?: string;
}

function formatNotificationDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getNotificationMessage(notification: NotificationListItem): string {
  return notification.message ?? notification.content ?? "";
}

function getNotificationHref(
  notification: NotificationListItem
): string | null {
  return notification.link ?? notification.url ?? null;
}

function getTypeLabel(type?: string): string {
  if (!type) {
    return "Notification";
  }

  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getTypeIndicator(type?: string): string {
  const normalized = type?.toUpperCase();

  if (normalized?.includes("ERROR")) {
    return "bg-red-500";
  }

  if (
    normalized?.includes("WARNING") ||
    normalized?.includes("EXPIR") ||
    normalized?.includes("REJECT")
  ) {
    return "bg-amber-500";
  }

  if (
    normalized?.includes("SUCCESS") ||
    normalized?.includes("AWARD") ||
    normalized?.includes("APPROV")
  ) {
    return "bg-emerald-500";
  }

  return "bg-tenderhub-gold";
}

function getTypeBadge(type?: string): string {
  const normalized = type?.toUpperCase();

  if (normalized?.includes("ERROR")) {
    return "bg-red-50 text-red-700";
  }

  if (
    normalized?.includes("WARNING") ||
    normalized?.includes("EXPIR") ||
    normalized?.includes("REJECT")
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    normalized?.includes("SUCCESS") ||
    normalized?.includes("AWARD") ||
    normalized?.includes("APPROV")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default function NotificationList({
  notifications = [],
  loading = false,
  error = null,
  page = 1,
  pageSize = 10,
  totalPages,
  onPageChange,
  onOpen,
  onMarkRead,
  onMarkUnread,
  onMarkAllRead,
  onDelete,
  onRefresh,
  className = "",
}: NotificationListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const notificationTypes = useMemo(() => {
    const types = notifications
      .map((notification) => notification.type)
      .filter((type): type is string => Boolean(type));

    return Array.from(new Set(types)).sort();
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const message = getNotificationMessage(notification);
      const type = notification.type ?? "";

      const matchesSearch =
        normalizedSearch.length === 0 ||
        notification.title?.toLowerCase().includes(normalizedSearch) ||
        message.toLowerCase().includes(normalizedSearch) ||
        type.toLowerCase().includes(normalizedSearch);

      const matchesReadFilter =
        filter === "ALL" ||
        (filter === "UNREAD" && !notification.read) ||
        (filter === "READ" && notification.read);

      const matchesType =
        typeFilter === "ALL" || notification.type === typeFilter;

      return matchesSearch && matchesReadFilter && matchesType;
    });
  }, [filter, notifications, search, typeFilter]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const effectiveTotalPages =
    totalPages && totalPages > 0
      ? totalPages
      : Math.max(1, Math.ceil(notifications.length / pageSize));

  function handleOpen(notification: NotificationListItem): void {
    if (!notification.read) {
      onMarkRead?.(notification);
    }

    if (onOpen) {
      onOpen(notification);
      return;
    }

    const href = getNotificationHref(notification);

    if (href) {
      window.location.href = href;
    }
  }

  function handlePageChange(nextPage: number): void {
    if (
      nextPage < 1 ||
      nextPage > effectiveTotalPages ||
      nextPage === page
    ) {
      return;
    }

    onPageChange?.(nextPage);
  }

  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-tenderhub-navy">
              Notifications
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {unreadCount > 0
                ? `${unreadCount} unread notification${
                    unreadCount === 1 ? "" : "s"
                  }`
                : "You have no unread notifications"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onMarkAllRead && unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-tenderhub-navy hover:text-tenderhub-navy"
              >
                Mark all as read
              </button>
            )}

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="rounded-lg bg-tenderhub-navy px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <label className="block">
            <span className="sr-only">Search notifications</span>

            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path
                  strokeLinecap="round"
                  d="m20 20-4-4"
                />
              </svg>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notifications..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
              />
            </div>
          </label>

          <label className="block">
            <span className="sr-only">Filter notifications by status</span>

            <select
              value={filter}
              onChange={(event) =>
                setFilter(
                  event.target.value as "ALL" | "UNREAD" | "READ"
                )
              }
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
            >
              <option value="ALL">All notifications</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
          </label>

          <label className="block">
            <span className="sr-only">Filter notifications by type</span>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
            >
              <option value="ALL">All types</option>

              {notificationTypes.map((type) => (
                <option key={type} value={type}>
                  {getTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center px-5 py-12">
          <div className="flex flex-col items-center gap-3">
            <span
              className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-tenderhub-gold"
              aria-hidden="true"
            />

            <p className="text-sm text-slate-500">
              Loading notifications...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="px-5 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3.75h.007v.007H12v-.007Zm9-3.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>

          <h2 className="text-sm font-semibold text-slate-800">
            Unable to load notifications
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {error}
          </p>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="mt-4 rounded-lg bg-tenderhub-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Try again
            </button>
          )}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 1-5.714 0A8.967 8.967 0 0 1 6 15.75v-3.375a6 6 0 1 1 12 0v3.375a8.967 8.967 0 0 1-3.143 1.332ZM14.25 19.5a2.25 2.25 0 0 1-4.5 0"
              />
            </svg>
          </div>

          <h2 className="text-sm font-semibold text-slate-800">
            {search || filter !== "ALL" || typeFilter !== "ALL"
              ? "No matching notifications"
              : "No notifications"}
          </h2>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            {search || filter !== "ALL" || typeFilter !== "ALL"
              ? "Try changing your search or filters."
              : "New updates and activity will appear here."}
          </p>

          {(search || filter !== "ALL" || typeFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFilter("ALL");
                setTypeFilter("ALL");
              }}
              className="mt-4 text-sm font-semibold text-tenderhub-navy hover:text-tenderhub-gold"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => {
              const message = getNotificationMessage(notification);
              const typeLabel = getTypeLabel(notification.type);
              const indicator = getTypeIndicator(notification.type);
              const badge = getTypeBadge(notification.type);

              return (
                <article
                  key={notification.id}
                  className={`px-5 py-4 transition ${
                    notification.read
                      ? "bg-white"
                      : "bg-slate-50/80"
                  } hover:bg-slate-50`}
                >
                  <div className="flex gap-4">
                    <span
                      className={`mt-2 h-3 w-3 shrink-0 rounded-full ${indicator}`}
                      aria-hidden="true"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <button
                          type="button"
                          onClick={() => handleOpen(notification)}
                          className={`text-left text-sm hover:text-tenderhub-gold ${
                            notification.read
                              ? "font-medium text-slate-800"
                              : "font-semibold text-tenderhub-navy"
                          }`}
                        >
                          {notification.title || typeLabel}
                        </button>

                        <span
                          className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-medium ${badge}`}
                        >
                          {typeLabel}
                        </span>
                      </div>

                      {message && (
                        <button
                          type="button"
                          onClick={() => handleOpen(notification)}
                          className="mt-1 block text-left text-sm leading-6 text-slate-600"
                        >
                          {message}
                        </button>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="text-xs text-slate-400">
                          {formatNotificationDate(notification.createdAt)}
                        </span>

                        <div className="flex flex-wrap items-center gap-3">
                          {!notification.read && onMarkRead && (
                            <button
                              type="button"
                              onClick={() => onMarkRead(notification)}
                              className="text-xs font-semibold text-tenderhub-navy hover:text-tenderhub-gold"
                            >
                              Mark as read
                            </button>
                          )}

                          {notification.read && onMarkUnread && (
                            <button
                              type="button"
                              onClick={() => onMarkUnread(notification)}
                              className="text-xs font-semibold text-tenderhub-navy hover:text-tenderhub-gold"
                            >
                              Mark as unread
                            </button>
                          )}

                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(notification)}
                              className="text-xs font-semibold text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {effectiveTotalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || !onPageChange}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-tenderhub-navy hover:text-tenderhub-navy disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={
                  page >= effectiveTotalPages || !onPageChange
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-tenderhub-navy hover:text-tenderhub-navy disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}