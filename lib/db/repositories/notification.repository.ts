import { NotificationType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function findNotificationById(id: string) {
  return prisma.notification.findUnique({
    where: { id },
  });
}

export async function createNotification(
  data: Prisma.NotificationCreateInput,
) {
  return prisma.notification.create({
    data,
  });
}

export async function updateNotification(
  id: string,
  data: Prisma.NotificationUpdateInput,
) {
  return prisma.notification.update({
    where: { id },
    data,
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

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
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

export async function listNotifications({
  userId,
  type,
  unreadOnly = false,
  skip = 0,
  take = 20,
}: {
  userId: string;
  type?: NotificationType;
  unreadOnly?: boolean;
  skip?: number;
  take?: number;
}) {
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(type ? { type } : {}),
    ...(unreadOnly ? { read: false } : {}),
  };

  return prisma.notification.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

export async function countNotifications({
  userId,
  type,
  unreadOnly = false,
}: {
  userId: string;
  type?: NotificationType;
  unreadOnly?: boolean;
}) {
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(type ? { type } : {}),
    ...(unreadOnly ? { read: false } : {}),
  };

  return prisma.notification.count({
    where,
  });
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

export async function createNotifications(
  data: Prisma.NotificationCreateManyInput[],
) {
  return prisma.notification.createMany({
    data,
  });
}

export async function deleteReadNotifications(userId: string) {
  return prisma.notification.deleteMany({
    where: {
      userId,
      read: true,
    },
  });
}