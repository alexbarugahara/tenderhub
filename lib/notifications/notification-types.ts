import type { NotificationType } from "@prisma/client";

export type NotificationMetadata = Record<
  string,
  string | number | boolean | null
>;

export type NotificationPayload = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: NotificationMetadata | null;
};

export type NotificationSummary = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
};

export type NotificationListFilters = {
  userId: string;
  type?: NotificationType;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
};

export type NotificationListResult = {
  notifications: NotificationSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type NotificationPreference = {
  type: NotificationType;
  enabled: boolean;
};

export type NotificationPreferenceMap = Partial<
  Record<NotificationType, boolean>
>;

export function isNotificationRead(
  notification: Pick<NotificationSummary, "readAt">,
): boolean {
  return notification.readAt !== null;
}

export function isNotificationUnread(
  notification: Pick<NotificationSummary, "readAt">,
): boolean {
  return notification.readAt === null;
}

export function createNotificationSummary(
  notification: NotificationSummary,
): NotificationSummary {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    metadata: notification.metadata,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

export function normalizeNotificationMetadata(
  metadata?: NotificationMetadata | null,
): NotificationMetadata | null {
  if (!metadata) {
    return null;
  }

  return { ...metadata };
}