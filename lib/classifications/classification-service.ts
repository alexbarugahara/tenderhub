import {
  ClassificationType,
} from "@prisma/client";

import {
  createClassification,
  deleteClassification,
  findClassificationByCode,
  findClassificationById,
  listClassifications,
  updateClassification,
} from "@/lib/db/repositories/classification.repository";

export interface CreateClassificationInput {
  code: string;
  name: string;
  type: ClassificationType;
  description?: string;
  parentId?: string;
}

export interface UpdateClassificationInput {
  code?: string;
  name?: string;
  type?: ClassificationType;
  description?: string;
  parentId?: string | null;
}

export interface ListClassificationsInput {
  type?: ClassificationType;
  parentId?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

function normalizeText(
  value?: string | null,
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeCreateInput(
  input: CreateClassificationInput,
): CreateClassificationInput {
  return {
    code: input.code.trim(),
    name: input.name.trim(),
    type: input.type,
    description: normalizeText(input.description),
    parentId: normalizeText(input.parentId),
  };
}

function normalizeUpdateInput(
  input: UpdateClassificationInput,
): UpdateClassificationInput {
  return {
    ...(input.code !== undefined
      ? { code: input.code.trim() }
      : {}),
    ...(input.name !== undefined
      ? { name: input.name.trim() }
      : {}),
    ...(input.type !== undefined
      ? { type: input.type }
      : {}),
    ...(input.description !== undefined
      ? { description: normalizeText(input.description) }
      : {}),
    ...(input.parentId !== undefined
      ? { parentId: normalizeText(input.parentId) ?? null }
      : {}),
  };
}

export async function getClassificationById(id: string) {
  return findClassificationById(id);
}

export async function getClassificationByCode(code: string) {
  return findClassificationByCode(code.trim());
}

export async function createNewClassification(
  input: CreateClassificationInput,
) {
  const data = normalizeCreateInput(input);

  const existing = await findClassificationByCode(data.code);

  if (existing) {
    throw new Error(
      `Classification with code "${data.code}" already exists.`,
    );
  }

  return createClassification(data);
}

export async function editClassification(
  id: string,
  input: UpdateClassificationInput,
) {
  const data = normalizeUpdateInput(input);

  if (data.code) {
    const existing = await findClassificationByCode(data.code);

    if (existing && existing.id !== id) {
      throw new Error(
        `Classification with code "${data.code}" already exists.`,
      );
    }
  }

  return updateClassification(id, data);
}

export async function removeClassification(id: string) {
  return deleteClassification(id);
}

export async function getClassifications(
  input: ListClassificationsInput = {},
) {
  return listClassifications({
    type: input.type,
    parentId: input.parentId,
    search: normalizeText(input.search),
    page: input.page,
    pageSize: input.pageSize,
  });
}

export async function classificationExistsByCode(
  code: string,
): Promise<boolean> {
  const classification = await findClassificationByCode(code.trim());

  return Boolean(classification);
}

export async function getClassificationsByType(
  type: ClassificationType,
  page?: number,
  pageSize?: number,
) {
  return listClassifications({
    type,
    page,
    pageSize,
  });
}

export async function getChildClassifications(
  parentId: string,
  page?: number,
  pageSize?: number,
) {
  return listClassifications({
    parentId,
    page,
    pageSize,
  });
}

export async function searchClassifications(
  search: string,
  type?: ClassificationType,
  page?: number,
  pageSize?: number,
) {
  return listClassifications({
    search: search.trim(),
    type,
    page,
    pageSize,
  });
}