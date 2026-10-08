"use server";

import {
  MilestoneStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import {
  addContractMilestone,
  removeContractMilestone,
  findContractMilestoneById,
  updateContractMilestone,
} from "@/lib/db/repositories/contract.repository";

export interface CreateMilestoneInput {
  contractId: string;
  title: string;
  description?: string | null;
  status?: MilestoneStatus;
  dueDate?: Date | null;
  amount?: number | null;
  completedAt?: Date | null;
}

export interface UpdateMilestoneInput {
  title?: string;
  description?: string | null;
  status?: MilestoneStatus;
  dueDate?: Date | null;
  amount?: number | null;
  completedAt?: Date | null;
}

export interface ListMilestonesInput {
  contractId: string;
  status?: MilestoneStatus;
  page?: number;
  pageSize?: number;
}

function normalizeRequiredString(
  value: string,
): string {
  return value.trim();
}

function normalizeOptionalString(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function normalizeCreateInput(
  input: CreateMilestoneInput,
): CreateMilestoneInput {
  return {
    ...input,
    contractId:
      normalizeRequiredString(input.contractId),
    title: normalizeRequiredString(input.title),
    description:
      normalizeOptionalString(input.description),
    status:
      input.status ?? MilestoneStatus.PENDING,
  };
}

function normalizeUpdateInput(
  input: UpdateMilestoneInput,
): UpdateMilestoneInput {
  return {
    ...input,
    title:
      input.title === undefined
        ? undefined
        : normalizeRequiredString(input.title),
    description:
      input.description === null
        ? undefined
        : normalizeOptionalString(input.description),
  };
}

function normalizeListInput(
  input: ListMilestonesInput,
): ListMilestonesInput {
  return {
    ...input,
    contractId:
      normalizeRequiredString(input.contractId),
    page: Math.max(1, input.page ?? 1),
    pageSize: Math.min(
      100,
      Math.max(1, input.pageSize ?? 20),
    ),
  };
}

function validateMilestoneDates(
  dueDate: Date | null | undefined,
  completedAt: Date | null | undefined,
): void {
  if (
    dueDate &&
    Number.isNaN(dueDate.getTime())
  ) {
    throw new Error(
      "Milestone due date is invalid.",
    );
  }

  if (
    completedAt &&
    Number.isNaN(completedAt.getTime())
  ) {
    throw new Error(
      "Milestone completion date is invalid.",
    );
  }

  if (
    dueDate &&
    completedAt &&
    completedAt.getTime() < dueDate.getTime()
  ) {
    throw new Error(
      "Milestone completion date cannot be before its due date.",
    );
  }
}

function validateAmount(
  amount: number | null | undefined,
): void {
  if (
    amount !== undefined &&
    amount !== null &&
    (!Number.isFinite(amount) || amount < 0)
  ) {
    throw new Error(
      "Milestone amount must be a valid non-negative number.",
    );
  }
}

export async function getMilestoneById(
  id: string,
) {
  if (!id?.trim()) {
    throw new Error(
      "Milestone ID is required.",
    );
  }

  return findContractMilestoneById(
    id.trim(),
  );
}

export async function getMilestones(
  input: ListMilestonesInput,
) {
  const normalized =
    normalizeListInput(input);

  const skip =
    (normalized.page! - 1) *
    normalized.pageSize!;

  return prisma.contractMilestone.findMany({
    where: {
      contractId: normalized.contractId,
      ...(normalized.status
        ? { status: normalized.status }
        : {}),
    },
    orderBy: {
      dueDate: "asc",
    },
    skip,
    take: normalized.pageSize,
  });
}

export async function createNewMilestone(
  input: CreateMilestoneInput,
) {
  const normalized =
    normalizeCreateInput(input);

  if (!normalized.contractId) {
    throw new Error(
      "Contract ID is required.",
    );
  }

  if (!normalized.title) {
    throw new Error(
      "Milestone title is required.",
    );
  }

  if (normalized.title.length > 255) {
    throw new Error(
      "Milestone title cannot exceed 255 characters.",
    );
  }

  if (
    normalized.description &&
    normalized.description.length > 10000
  ) {
    throw new Error(
      "Milestone description cannot exceed 10,000 characters.",
    );
  }

  validateMilestoneDates(
    normalized.dueDate,
    normalized.completedAt,
  );

  validateAmount(normalized.amount);

  const data: Prisma.ContractMilestoneCreateInput = {
    contract: {
      connect: {
        id: normalized.contractId,
      },
    },
    title: normalized.title,
    ...(normalized.description !== undefined
      ? {
        description:
          normalized.description,
      }
      : {}),
    status:
      normalized.status ??
      MilestoneStatus.PENDING,
    ...(normalized.dueDate !== undefined
      ? {
        dueDate: normalized.dueDate,
      }
      : {}),
    ...(normalized.amount !== undefined
      ? {
        amount:
          normalized.amount === null
            ? null
            : normalized.amount,
      }
      : {}),
    ...(normalized.completedAt !== undefined
      ? {
        completedAt:
          normalized.completedAt,
      }
      : {}),
  };

  return addContractMilestone(data);
}

export async function editMilestone(
  id: string,
  input: UpdateMilestoneInput,
) {
  if (!id?.trim()) {
    throw new Error(
      "Milestone ID is required.",
    );
  }

  const milestone =
    await findContractMilestoneById(
      id.trim(),
    );

  if (!milestone) {
    throw new Error(
      "Milestone not found.",
    );
  }

  if (
    milestone.status ===
    MilestoneStatus.COMPLETED ||
    milestone.status ===
    MilestoneStatus.CANCELLED
  ) {
    throw new Error(
      "A completed or cancelled milestone cannot be edited.",
    );
  }

  const normalized =
    normalizeUpdateInput(input);

  if (
    normalized.title !== undefined &&
    !normalized.title
  ) {
    throw new Error(
      "Milestone title is required.",
    );
  }

  if (
    normalized.title !== undefined &&
    normalized.title.length > 255
  ) {
    throw new Error(
      "Milestone title cannot exceed 255 characters.",
    );
  }

  if (
    normalized.description &&
    normalized.description.length > 10000
  ) {
    throw new Error(
      "Milestone description cannot exceed 10,000 characters.",
    );
  }

  validateMilestoneDates(
    normalized.dueDate,
    normalized.completedAt,
  );

  validateAmount(normalized.amount);

  const data: Prisma.ContractMilestoneUpdateInput =
  {
    ...(normalized.title !== undefined
      ? {
        title: normalized.title,
      }
      : {}),
    ...(normalized.description !==
      undefined
      ? {
        description:
          normalized.description,
      }
      : {}),
    ...(normalized.status !== undefined
      ? {
        status: normalized.status,
      }
      : {}),
    ...(normalized.dueDate !== undefined
      ? {
        dueDate: normalized.dueDate,
      }
      : {}),
    ...(normalized.amount !== undefined
      ? {
        amount:
          normalized.amount === null
            ? null
            : normalized.amount,
      }
      : {}),
    ...(normalized.completedAt !==
      undefined
      ? {
        completedAt:
          normalized.completedAt,
      }
      : {}),
  };

  return updateContractMilestone(
    id.trim(),
    data,
  );
}

export async function changeMilestoneStatus(
  id: string,
  status: MilestoneStatus,
) {
  if (!id?.trim()) {
    throw new Error(
      "Milestone ID is required.",
    );
  }

  if (
    !Object.values(MilestoneStatus).includes(
      status,
    )
  ) {
    throw new Error(
      "Invalid milestone status.",
    );
  }

  const milestone =
    await findContractMilestoneById(
      id.trim(),
    );

  if (!milestone) {
    throw new Error(
      "Milestone not found.",
    );
  }

  if (
    milestone.status ===
    MilestoneStatus.COMPLETED ||
    milestone.status ===
    MilestoneStatus.CANCELLED
  ) {
    throw new Error(
      "A completed or cancelled milestone cannot change status.",
    );
  }

  return updateContractMilestone(
    id.trim(),
    {
      status,
    },
  );
}

export async function removeMilestone(
  id: string,
) {
  if (!id?.trim()) {
    throw new Error(
      "Milestone ID is required.",
    );
  }

  const milestone =
    await findContractMilestoneById(
      id.trim(),
    );

  if (!milestone) {
    throw new Error(
      "Milestone not found.",
    );
  }

  if (
    milestone.status ===
    MilestoneStatus.COMPLETED
  ) {
    throw new Error(
      "A completed milestone cannot be deleted.",
    );
  }

  return removeContractMilestone(
    id.trim(),
  );
}

export async function startMilestone(
  id: string,
) {
  if (!id?.trim()) {
    throw new Error(
      "Milestone ID is required.",
    );
  }

  const milestone =
    await findContractMilestoneById(
      id.trim(),
    );

  if (!milestone) {
    throw new Error(
      "Milestone not found.",
    );
  }

  if (
    milestone.status !==
    MilestoneStatus.PENDING
  ) {
    throw new Error(
      "Only pending milestones can be started.",
    );
  }

  return updateContractMilestone(
    id.trim(),
    {
      status:
        MilestoneStatus.IN_PROGRESS,
    },
  );
}

export async function completeMilestone(
  id: string,
) {
  if (!id?.trim()) {
    throw new Error(
      "Milestone ID is required.",
    );
  }

  const milestone =
    await findContractMilestoneById(
      id.trim(),
    );

  if (!milestone) {
    throw new Error(
      "Milestone not found.",
    );
  }

  if (
    milestone.status !==
    MilestoneStatus.IN_PROGRESS
  ) {
    throw new Error(
      "Only milestones in progress can be completed.",
    );
  }

  return updateContractMilestone(
    id.trim(),
    {
      status:
        MilestoneStatus.COMPLETED,
      completedAt: new Date(),
    },
  );
}

export async function delayMilestone(
  id: string,
) {
  if (!id?.trim()) {
    throw new Error(
      "Milestone ID is required.",
    );
  }

  const milestone =
    await findContractMilestoneById(
      id.trim(),
    );

  if (!milestone) {
    throw new Error(
      "Milestone not found.",
    );
  }

  if (
    milestone.status !==
    MilestoneStatus.IN_PROGRESS &&
    milestone.status !==
    MilestoneStatus.PENDING
  ) {
    throw new Error(
      "Only pending or in-progress milestones can be marked as delayed.",
    );
  }

  return updateContractMilestone(
    id.trim(),
    {
      status:
        MilestoneStatus.DELAYED,
    },
  );
}

export async function cancelMilestone(
  id: string,
) {
  if (!id?.trim()) {
    throw new Error(
      "Milestone ID is required.",
    );
  }

  const milestone =
    await findContractMilestoneById(
      id.trim(),
    );

  if (!milestone) {
    throw new Error(
      "Milestone not found.",
    );
  }

  if (
    milestone.status ===
    MilestoneStatus.COMPLETED
  ) {
    throw new Error(
      "A completed milestone cannot be cancelled.",
    );
  }

  if (
    milestone.status ===
    MilestoneStatus.CANCELLED
  ) {
    throw new Error(
      "Milestone is already cancelled.",
    );
  }

  return updateContractMilestone(
    id.trim(),
    {
      status:
        MilestoneStatus.CANCELLED,
    },
  );
}

export async function resumeMilestone(
  id: string,
) {
  if (!id?.trim()) {
    throw new Error(
      "Milestone ID is required.",
    );
  }

  const milestone =
    await findContractMilestoneById(
      id.trim(),
    );

  if (!milestone) {
    throw new Error(
      "Milestone not found.",
    );
  }

  if (
    milestone.status !==
    MilestoneStatus.DELAYED
  ) {
    throw new Error(
      "Only delayed milestones can be resumed.",
    );
  }

  return updateContractMilestone(
    id.trim(),
    {
      status:
        MilestoneStatus.IN_PROGRESS,
    },
  );
}