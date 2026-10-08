import { LotStatus } from "@prisma/client";

import {
  createLot,
  deleteLot,
  findLotById,
  listLots,
  updateLot,
  updateLotStatus,
} from "@/lib/db/repositories/lot.repository";

export interface CreateLotInput {
  solicitationId: string;
  lotNumber: string | number;
  title: string;
  description?: string | null;
  status?: LotStatus;
  estimatedValue?: number | null;
}

export interface UpdateLotInput {
  lotNumber?: string | number;
  title?: string;
  description?: string | null;
  status?: LotStatus;
  estimatedValue?: number | null;
}

export interface ListLotsInput {
  solicitationId: string;
  status?: LotStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

function normalizeRequiredString(value: string): string {
  return value.trim();
}

function normalizeLotNumber(value: string | number): number {
  const normalized =
    typeof value === "number"
      ? value
      : Number(value.trim());

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error("Lot number must be a positive integer.");
  }

  return normalized;
}

function normalizeOptionalString(
  value?: string | null,
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeAmount(
  value?: number | null,
): number | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    throw new Error("Estimated value must be a valid number.");
  }

  return amount;
}

export async function getLotById(id: string) {
  return findLotById(id);
}

export async function getLots(
  input: ListLotsInput,
) {
  const page = Math.max(1, input.page ?? 1);

  const pageSize = Math.min(
    100,
    Math.max(1, input.pageSize ?? 20),
  );

  const skip = (page - 1) * pageSize;

  return listLots({
    solicitationId: normalizeRequiredString(
      input.solicitationId,
    ),
    status: input.status,
    search: input.search?.trim() || undefined,
    skip,
    take: pageSize,
  });
}

export async function createNewLot(
  input: CreateLotInput,
) {
  return createLot({
    solicitation: {
      connect: {
        id: normalizeRequiredString(
          input.solicitationId,
        ),
      },
    },
    number: normalizeLotNumber(input.lotNumber),
    title: normalizeRequiredString(input.title),
    description: normalizeOptionalString(
      input.description,
    ),
    status: input.status ?? LotStatus.OPEN,
    estimatedValue: normalizeAmount(
      input.estimatedValue,
    ),
  });
}

export async function editLot(
  id: string,
  input: UpdateLotInput,
) {
  const existingLot = await findLotById(id);

  if (!existingLot) {
    throw new Error("Lot not found.");
  }

  return updateLot(id, {
    number:
      input.lotNumber !== undefined
        ? normalizeLotNumber(input.lotNumber)
        : undefined,

    title:
      input.title !== undefined
        ? normalizeRequiredString(input.title)
        : undefined,

    description:
      input.description !== undefined
        ? normalizeOptionalString(input.description)
        : undefined,

    status: input.status,

    estimatedValue:
      input.estimatedValue !== undefined
        ? normalizeAmount(input.estimatedValue)
        : undefined,
  });
}

export async function changeLotStatus(
  id: string,
  status: LotStatus,
) {
  const existingLot = await findLotById(id);

  if (!existingLot) {
    throw new Error("Lot not found.");
  }

  return updateLotStatus(id, status);
}

export async function removeLot(id: string) {
  const existingLot = await findLotById(id);

  if (!existingLot) {
    throw new Error("Lot not found.");
  }

  return deleteLot(id);
}

export async function openLot(id: string) {
  return changeLotStatus(id, LotStatus.OPEN);
}

export async function closeLot(id: string) {
  return changeLotStatus(id, LotStatus.CLOSED);
}

export async function awardLot(id: string) {
  return changeLotStatus(id, LotStatus.AWARDED);
}

export async function cancelLot(id: string) {
  return changeLotStatus(id, LotStatus.CANCELLED);
}