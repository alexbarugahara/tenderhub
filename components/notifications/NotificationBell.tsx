"use client";

import { useEffect, useRef, useState } from "react";

export interface NotificationBellItem {
  id: string;
  title?: string;
  message?: string;
  content?: string;
  type?: string;
  read?: boolean;
  createdAt: string | Date;
  link?: string;
  url?: string;
}

export interface NotificationBellProps {
  notifications?: NotificationBellItem[];
  unreadCount?: number;
  loading?: boolean;
  error?: string | null;
  onOpen?: (notification: NotificationBellItem) => void;
  onMarkRead?: (notification: NotificationBellItem) => void;
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
  className?: string;
}

function formatNotificationDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const difference = now.getTime() - date.getTime();

  if (difference < 0) {
    return date.toLocaleDateString();
  }

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getNotificationMessage(notification: NotificationBellItem): string {
  return notification.message ?? notification.content ?? "";
}

function getNotificationHref(
  notification: NotificationBellItem
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

export default function NotificationBell({
  notifications = [],
  unreadCount,
  loading = false,
  error = null,
  onOpen,
  onMarkRead,
  onMarkAllRead,
  onViewAll,
  className = "",
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const derivedUnreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const count = unreadCount ?? derivedUnreadCount;

  const visibleNotifications = notifications.slice(0, 6);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function handleNotificationClick(
    notification: NotificationBellItem
  ): void {
    if (!notification.read) {
      onMarkRead?.(notification);
    }

    onOpen?.(notification);

    const href = getNotificationHref(notification);

    if (href && !onOpen) {
      window.location.href = href;
    }

    setIsOpen(false);
  }

  function handleViewAll(): void {
    setIsOpen(false);
    onViewAll?.();
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={
          count > 0
            ? `Notifications, ${count} unread`
            : "Notifications"
        }
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setIsOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-tenderhub-navy focus:outline-none focus:ring-2 focus:ring-tenderhub-gold focus:ring-offset-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
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
            d="M14.857 17.082a23.848 23.848 0 0 1-5.714 0A8.967 8.967 0 0 1 6 15.75v-3.375a6 6 0 1 1 12 0v3.375a8.967 8.967 0 0 1-3.143 1.332ZM14.25 19.5a2.25 2.25 0 0 1-4.5 0"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 6.75a4.5 4.5 0 0 1 4.5 0"
          />
        </svg>

        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-tenderhub-gold px-1 text-[10px] font-bold leading-4 text-tenderhub-navy ring-2 ring-white"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-tenderhub-navy">
                Notifications
              </h2>

              {count > 0 ? (
                <p className="mt-0.5 text-xs text-slate-500">
                  {count} unread notification{count === 1 ? "" : "s"}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-slate-500">
                  You are all caught up
                </p>
              )}
            </div>

            {count > 0 && onMarkAllRead && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs font-medium text-tenderhub-navy transition hover:text-tenderhub-gold"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center px-4 py-10">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-tenderhub-gold"
                  aria-hidden="true"
                />
                Loading notifications...
              </div>
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
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
                    d="M12 9v3.75m0 3.75h.007v.007H12v-.007Zm9-3.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>

              <p className="text-sm font-medium text-slate-700">
                Unable to load notifications
              </p>

              <p className="mt-1 text-xs text-slate-500">{error}</p>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
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
                    d="M14.857 17.082a23.848 23.848 0 0 1-5.714 0A8.967 8.967 0 0 1 6 15.75v-3.375a6 6 0 1 1 12 0v3.375a8.967 8.967 0 0 1-3.143 1.332ZM14.25 19.5a2.25 2.25 0 0 1-4.5 0"
                  />
                </svg>
              </div>

              <p className="text-sm font-medium text-slate-700">
                No notifications
              </p>

              <p className="mt-1 text-xs text-slate-500">
                New updates and activity will appear here.
              </p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              {visibleNotifications.map((notification) => {
                const message = getNotificationMessage(notification);
                const typeLabel = getTypeLabel(notification.type);
                const indicator = getTypeIndicator(notification.type);

                return (
                  <button
                    key={notification.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50 ${
                      notification.read ? "bg-white" : "bg-slate-50/70"
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${indicator}`}
                      aria-hidden="true"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span
                          className={`text-sm ${
                            notification.read
                              ? "font-medium text-slate-700"
                              : "font-semibold text-tenderhub-navy"
                          }`}
                        >
                          {notification.title || typeLabel}
                        </span>

                        {!notification.read && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-tenderhub-gold" />
                        )}
                      </span>

                      {message && (
                        <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">
                          {message}
                        </span>
                      )}

                      <span className="mt-1.5 block text-[11px] text-slate-400">
                        {formatNotificationDate(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !error && notifications.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full rounded-lg px-3 py-2 text-center text-sm font-semibold text-tenderhub-navy transition hover:bg-white hover:text-tenderhub-gold"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}