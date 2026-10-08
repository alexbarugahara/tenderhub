"use client";

export type NotificationItemType = string;

export interface NotificationItemData {
  id: string;
  title?: string;
  message?: string;
  content?: string;
  type?: NotificationItemType;
  read?: boolean;
  createdAt: string | Date;
  link?: string;
  url?: string;
}

export interface NotificationItemProps {
  notification: NotificationItemData;
  onOpen?: (notification: NotificationItemData) => void;
  onMarkRead?: (notification: NotificationItemData) => void;
  onMarkUnread?: (notification: NotificationItemData) => void;
  onDelete?: (notification: NotificationItemData) => void;
  showActions?: boolean;
  compact?: boolean;
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

function getMessage(notification: NotificationItemData): string {
  return notification.message ?? notification.content ?? "";
}

function getHref(notification: NotificationItemData): string | null {
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

function getIndicatorClass(type?: string): string {
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

function getTypeBadgeClass(type?: string): string {
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

function getNotificationIcon(type?: string) {
  const normalized = type?.toUpperCase();

  if (normalized?.includes("ERROR")) {
    return (
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
    );
  }

  if (
    normalized?.includes("WARNING") ||
    normalized?.includes("EXPIR")
  ) {
    return (
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
          d="M12 9v3m0 3h.007v.007H12V15Zm9 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
    );
  }

  if (
    normalized?.includes("AWARD") ||
    normalized?.includes("APPROV") ||
    normalized?.includes("SUCCESS")
  ) {
    return (
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
          d="m9 12 2 2 4-4"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
        />
      </svg>
    );
  }

  return (
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
    </svg>
  );
}

export default function NotificationItem({
  notification,
  onOpen,
  onMarkRead,
  onMarkUnread,
  onDelete,
  showActions = true,
  compact = false,
  className = "",
}: NotificationItemProps) {
  const message = getMessage(notification);
  const typeLabel = getTypeLabel(notification.type);
  const indicatorClass = getIndicatorClass(notification.type);
  const badgeClass = getTypeBadgeClass(notification.type);
  const href = getHref(notification);

  function handleOpen(): void {
    if (!notification.read) {
      onMarkRead?.(notification);
    }

    if (onOpen) {
      onOpen(notification);
      return;
    }

    if (href) {
      window.location.href = href;
    }
  }

  function handleMarkRead(
    event: React.MouseEvent<HTMLButtonElement>
  ): void {
    event.stopPropagation();
    onMarkRead?.(notification);
  }

  function handleMarkUnread(
    event: React.MouseEvent<HTMLButtonElement>
  ): void {
    event.stopPropagation();
    onMarkUnread?.(notification);
  }

  function handleDelete(
    event: React.MouseEvent<HTMLButtonElement>
  ): void {
    event.stopPropagation();
    onDelete?.(notification);
  }

  return (
    <article
      className={`group border-b border-slate-100 transition last:border-b-0 ${
        notification.read ? "bg-white" : "bg-slate-50/70"
      } hover:bg-slate-50 ${className}`}
    >
      <div className={`flex gap-3 ${compact ? "px-3 py-3" : "px-5 py-4"}`}>
        <div className="relative shrink-0">
          <div
            className={`flex items-center justify-center rounded-full bg-slate-100 text-slate-600 ${
              compact ? "h-9 w-9" : "h-10 w-10"
            }`}
          >
            {getNotificationIcon(notification.type)}
          </div>

          {!notification.read && (
            <span
              className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${indicatorClass} ring-2 ring-white`}
              aria-label="Unread"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={handleOpen}
              className="min-w-0 flex-1 text-left"
            >
              <span
                className={`block truncate text-sm ${
                  notification.read
                    ? "font-medium text-slate-800"
                    : "font-semibold text-tenderhub-navy"
                }`}
              >
                {notification.title || typeLabel}
              </span>

              {message && (
                <span
                  className={`mt-1 block ${
                    compact
                      ? "line-clamp-1 text-xs"
                      : "line-clamp-2 text-sm"
                  } leading-5 text-slate-500`}
                >
                  {message}
                </span>
              )}
            </button>

            <span
              className={`hidden shrink-0 rounded-full px-2 py-1 text-[10px] font-medium sm:inline-flex ${badgeClass}`}
            >
              {typeLabel}
            </span>
          </div>

          <div
            className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${
              compact ? "mt-1.5" : "mt-2.5"
            }`}
          >
            <span className="text-[11px] text-slate-400">
              {formatNotificationDate(notification.createdAt)}
            </span>

            {showActions && (
              <>
                {!notification.read && onMarkRead && (
                  <button
                    type="button"
                    onClick={handleMarkRead}
                    className="text-[11px] font-semibold text-tenderhub-navy transition hover:text-tenderhub-gold"
                  >
                    Mark read
                  </button>
                )}

                {notification.read && onMarkUnread && (
                  <button
                    type="button"
                    onClick={handleMarkUnread}
                    className="text-[11px] font-semibold text-tenderhub-navy transition hover:text-tenderhub-gold"
                  >
                    Mark unread
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-[11px] font-semibold text-red-600 transition hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>

          <span
            className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-medium sm:hidden ${badgeClass}`}
          >
            {typeLabel}
          </span>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={handleOpen}
            aria-label={`Open ${notification.title || typeLabel}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-70 transition hover:bg-white hover:text-tenderhub-navy group-hover:opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9 5 7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}