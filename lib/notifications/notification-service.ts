import { Prisma, NotificationType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
};

export type UpdateNotificationInput = {
  type?: NotificationType;
  title?: string;
  message?: string;
  link?: string | null;
  read?: boolean;
};

export type ListNotificationsInput = {
  userId: string;
  type?: NotificationType;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
};

function normalizePagination(page = 1, pageSize = 20) {
  const normalizedPage = Number.isFinite(page)
    ? Math.max(1, Math.floor(page))
    : 1;

  const normalizedPageSize = Number.isFinite(pageSize)
    ? Math.min(100, Math.max(1, Math.floor(pageSize)))
    : 20;

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    skip: (normalizedPage - 1) * normalizedPageSize,
    take: normalizedPageSize,
  };
}

function normalizeString(value: string, fieldName: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalized;
}

export async function getNotificationById(id: string) {
  return prisma.notification.findUnique({
    where: { id },
  });
}

export async function createNotification(
  input: CreateNotificationInput,
) {
  const userId = normalizeString(input.userId, "User ID");
  const title = normalizeString(input.title, "Notification title");
  const message = normalizeString(input.message, "Notification message");

  return prisma.notification.create({
    data: {
      userId,
      type: input.type,
      title,
      message,
      link: input.link?.trim() || null,
    },
  });
}

export async function updateNotification(
  id: string,
  input: UpdateNotificationInput,
) {
  const data: Prisma.NotificationUpdateInput = {};

  if (input.type !== undefined) {
    data.type = input.type;
  }

  if (input.title !== undefined) {
    data.title = normalizeString(input.title, "Notification title");
  }

  if (input.message !== undefined) {
    data.message = normalizeString(
      input.message,
      "Notification message",
    );
  }

  if (input.link !== undefined) {
    data.link = input.link?.trim() || null;
  }

  if (input.read !== undefined) {
    data.read = input.read;
  }

  return prisma.notification.update({
    where: { id },
    data,
  });
}

export async function getNotifications(
  input: ListNotificationsInput,
) {
  const userId = normalizeString(input.userId, "User ID");

  const { page, pageSize, skip, take } = normalizePagination(
    input.page,
    input.pageSize,
  );

  const where: Prisma.NotificationWhereInput = {
    userId,
  };

  if (input.type !== undefined) {
    where.type = input.type;
  }

  if (input.unreadOnly) {
    where.read = false;
  }

  const [notifications, total] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    }),
    prisma.notification.count({
      where,
    }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function getUserNotifications(
  userId: string,
  options?: Omit<ListNotificationsInput, "userId">,
) {
  return getNotifications({
    userId,
    ...options,
  });
}

export async function getUnreadNotifications(
  userId: string,
  options?: Omit<ListNotificationsInput, "userId" | "unreadOnly">,
) {
  return getNotifications({
    userId,
    ...options,
    unreadOnly: true,
  });
}

export async function getUnreadNotificationCount(
  userId: string,
) {
  const normalizedUserId = normalizeString(userId, "User ID");

  return prisma.notification.count({
    where: {
      userId: normalizedUserId,
      read: false,
    },
  });
}

export async function markNotificationAsRead(id: string) {
  return prisma.notification.update({
    where: { id },
    data: {
      read: true,
    },
  });
}

export async function markNotificationAsUnread(id: string) {
  return prisma.notification.update({
    where: { id },
    data: {
      read: false,
    },
  });
}

export async function markAllNotificationsAsRead(
  userId: string,
) {
  const normalizedUserId = normalizeString(userId, "User ID");

  return prisma.notification.updateMany({
    where: {
      userId: normalizedUserId,
      read: false,
    },
    data: {
      read: true,
    },
  });
}

export async function deleteNotification(id: string) {
  return prisma.notification.delete({
    where: { id },
  });
}

export async function deleteUserNotifications(
  userId: string,
) {
  const normalizedUserId = normalizeString(userId, "User ID");

  return prisma.notification.deleteMany({
    where: {
      userId: normalizedUserId,
    },
  });
}

export async function notificationExists(id: string) {
  const notification = await prisma.notification.findUnique({
    where: { id },
    select: {
      id: true,
    },
  });

  return notification !== null;
}

export async function isNotificationRead(id: string) {
  const notification = await prisma.notification.findUnique({
    where: { id },
    select: {
      read: true,
    },
  });

  return notification?.read === true;
}

export async function isNotificationUnread(id: string) {
  const notification = await prisma.notification.findUnique({
    where: { id },
    select: {
      read: true,
    },
  });

  return notification?.read === false;
}
