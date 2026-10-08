import {
  ClassificationType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export interface ListClassificationsRepositoryInput {
  type?: ClassificationType;
  parentId?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

function getPagination(
  page?: number,
  pageSize?: number,
): {
  skip: number;
  take: number;
} {
  const safePage = Math.max(1, page ?? 1);
  const safePageSize = Math.min(
    100,
    Math.max(1, pageSize ?? 20),
  );

  return {
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  };
}

export async function findClassificationById(
  id: string,
) {
  return prisma.classification.findUnique({
    where: { id },
  });
}

/**
 * Classification codes are only unique within their type.
 *
 * Example:
 *   NAICS + "541611"
 *   UNSPSC + "541611"
 *
 * may both exist, so code alone cannot be used with findUnique().
 */
export async function findClassificationByCode(
  code: string,
  type?: ClassificationType,
) {
  return prisma.classification.findFirst({
    where: {
      code,
      ...(type !== undefined ? { type } : {}),
    },
  });
}

export async function createClassification(
  data: Prisma.ClassificationUncheckedCreateInput,
) {
  return prisma.classification.create({
    data,
  });
}

export async function updateClassification(
  id: string,
  data: Prisma.ClassificationUncheckedUpdateInput,
) {
  return prisma.classification.update({
    where: { id },
    data,
  });
}

export async function deleteClassification(
  id: string,
) {
  return prisma.classification.delete({
    where: { id },
  });
}

export async function listClassifications({
  type,
  parentId,
  search,
  page,
  pageSize,
}: ListClassificationsRepositoryInput = {}) {
  const pagination = getPagination(page, pageSize);

  const normalizedSearch = search?.trim();

  const where: Prisma.ClassificationWhereInput = {
    ...(type !== undefined
      ? { type }
      : {}),
    ...(parentId !== undefined
      ? { parentId }
      : {}),
    ...(normalizedSearch
      ? {
          OR: [
            {
              code: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.classification.findMany({
    where,
    orderBy: [
      {
        name: "asc",
      },
      {
        code: "asc",
      },
    ],
    skip: pagination.skip,
    take: pagination.take,
  });
}

export async function countClassifications({
  type,
  parentId,
  search,
}: Omit<
  ListClassificationsRepositoryInput,
  "page" | "pageSize"
> = {}) {
  const normalizedSearch = search?.trim();

  const where: Prisma.ClassificationWhereInput = {
    ...(type !== undefined
      ? { type }
      : {}),
    ...(parentId !== undefined
      ? { parentId }
      : {}),
    ...(normalizedSearch
      ? {
          OR: [
            {
              code: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
            {
              name: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.classification.count({
    where,
  });
}