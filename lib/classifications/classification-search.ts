import { ClassificationType } from "@prisma/client";

import { listClassifications } from "@/lib/db/repositories/classification.repository";

export interface ClassificationSearchInput {
  query?: string;
  type?: ClassificationType;
  page?: number;
  pageSize?: number;
}

export async function searchClassifications(
  input: ClassificationSearchInput = {},
) {
  const query = input.query?.trim();

  return listClassifications({
    search: query,
    type: input.type,
    page: input.page,
    pageSize: input.pageSize,
  });
}

export async function searchClassificationsByType(
  query: string,
  type: ClassificationType,
  page?: number,
  pageSize?: number,
) {
  return listClassifications({
    search: query.trim(),
    type,
    page,
    pageSize,
  });
}

export async function getClassificationsForSearch(
  type?: ClassificationType,
  page?: number,
  pageSize?: number,
) {
  return listClassifications({
    type,
    page,
    pageSize,
  });
}