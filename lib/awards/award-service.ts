import {
  AwardStatus,
  Prisma,
} from "@prisma/client";

import {
  createAward,
  deleteAward,
  findAwardById,
  listAwards,
  updateAward,
  updateAwardStatus,
} from "@/lib/db/repositories/award.repository";

export interface CreateAwardInput {
  solicitationId: string;
  bidId: string;
  vendorId: string;
  lotId: string;
  status?: AwardStatus;
  awardNumber: string;
  awardAmount?: number | null;
  awardDate?: Date | null;
  notes?: string | null;
}

export interface UpdateAwardInput {
  solicitationId?: string;
  bidId?: string;
  vendorId?: string;
  lotId?: string;
  status?: AwardStatus;
  awardNumber?: string;
  awardAmount?: number | null;
  awardDate?: Date | null;
  notes?: string | null;
}

export interface ListAwardsInput {
  solicitationId?: string;
  bidId?: string;
  vendorId?: string;
  lotId?: string;
  status?: AwardStatus;
  page?: number;
  pageSize?: number;
}

function normalizeRequiredString(
  value: string,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      "A required value cannot be empty.",
    );
  }

  return normalized;
}

function normalizeOptionalString(
  value?: string | null,
): string | null | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return value;
  }

  const trimmed =
    value.trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function normalizeAmount(
  value?: number | null,
): Prisma.Decimal | null | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return value;
  }

  if (!Number.isFinite(value)) {
    throw new Error(
      "Award amount must be a valid number.",
    );
  }

  if (value < 0) {
    throw new Error(
      "Award amount cannot be negative.",
    );
  }

  return new Prisma.Decimal(value);
}

function normalizeDate(
  value?: Date | null,
): Date | null | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return value;
  }

  return value instanceof Date
    ? value
    : new Date(value);
}

export async function getAwardById(
  id: string,
) {
  return findAwardById(id);
}

export async function getAwards(
  input: ListAwardsInput = {},
) {
  const page = Math.max(
    1,
    input.page ?? 1,
  );

  const pageSize = Math.min(
    100,
    Math.max(
      1,
      input.pageSize ?? 20,
    ),
  );

  const skip =
    (page - 1) * pageSize;

  return listAwards({
    solicitationId:
      input.solicitationId,

    bidId:
      input.bidId,

    vendorId:
      input.vendorId,

    lotId:
      input.lotId,

    status:
      input.status,

    skip,

    take:
      pageSize,
  });
}

export async function createNewAward(
  input: CreateAwardInput,
) {
  const solicitationId =
    normalizeRequiredString(
      input.solicitationId,
    );

  const bidId =
    normalizeRequiredString(
      input.bidId,
    );

  const vendorId =
    normalizeRequiredString(
      input.vendorId,
    );

  const lotId =
    normalizeRequiredString(
      input.lotId,
    );

  const awardNumber =
    normalizeRequiredString(
      input.awardNumber,
    );

  const data: Prisma.AwardCreateInput = {
    solicitation: {
      connect: {
        id: solicitationId,
      },
    },

    lot: {
      connect: {
        id: lotId,
      },
    },

    bid: {
      connect: {
        id: bidId,
      },
    },

    vendor: {
      connect: {
        id: vendorId,
      },
    },

    awardNumber,

    status:
      input.status ??
      AwardStatus.PENDING,

    awardAmount:
      normalizeAmount(
        input.awardAmount,
      ) ??
      new Prisma.Decimal(0),

    awardDate:
      normalizeDate(
        input.awardDate,
      ) ??
      new Date(),

    notes:
      normalizeOptionalString(
        input.notes,
      ),
  };

  return createAward(data);
}

export async function editAward(
  id: string,
  input: UpdateAwardInput,
) {
  const existingAward =
    await findAwardById(id);

  if (!existingAward) {
    throw new Error(
      "Award not found.",
    );
  }

  const data: Prisma.AwardUpdateInput = {
    solicitation:
      input.solicitationId !==
        undefined
        ? {
          connect: {
            id:
              normalizeRequiredString(
                input.solicitationId,
              ),
          },
        }
        : undefined,

    bid:
      input.bidId !==
        undefined
        ? {
          connect: {
            id:
              normalizeRequiredString(
                input.bidId,
              ),
          },
        }
        : undefined,

    vendor:
      input.vendorId !==
        undefined
        ? {
          connect: {
            id:
              normalizeRequiredString(
                input.vendorId,
              ),
          },
        }
        : undefined,

    lot:
      input.lotId !==
        undefined
        ? {
          connect: {
            id:
              normalizeRequiredString(
                input.lotId,
              ),
          },
        }
        : undefined,

    status:
      input.status,

    awardNumber:
      input.awardNumber !==
        undefined
        ? normalizeRequiredString(
          input.awardNumber,
        )
        : undefined,

    awardAmount:
      input.awardAmount !==
        undefined
        ? normalizeAmount(
          input.awardAmount,
        ) ?? undefined
        : undefined,

    awardDate:
      input.awardDate !==
        undefined
        ? normalizeDate(
          input.awardDate,
        ) ?? undefined
        : undefined,

    notes:
      input.notes !==
        undefined
        ? normalizeOptionalString(
          input.notes,
        )
        : undefined,
  };

  return updateAward(
    id,
    data,
  );
}

export async function changeAwardStatus(
  id: string,
  status: AwardStatus,
) {
  const existingAward =
    await findAwardById(id);

  if (!existingAward) {
    throw new Error(
      "Award not found.",
    );
  }

  return updateAwardStatus(
    id,
    status,
  );
}

export async function removeAward(
  id: string,
) {
  const existingAward =
    await findAwardById(id);

  if (!existingAward) {
    throw new Error(
      "Award not found.",
    );
  }

  return deleteAward(id);
}

export async function approveAward(
  id: string,
) {
  const existingAward =
    await findAwardById(id);

  if (!existingAward) {
    throw new Error(
      "Award not found.",
    );
  }

  if (
    existingAward.status !==
    AwardStatus.PENDING
  ) {
    throw new Error(
      "Only pending awards can be approved.",
    );
  }

  return updateAwardStatus(
    id,
    AwardStatus.APPROVED,
  );
}

export async function acceptAward(
  id: string,
) {
  const existingAward =
    await findAwardById(id);

  if (!existingAward) {
    throw new Error(
      "Award not found.",
    );
  }

  if (
    existingAward.status !==
    AwardStatus.APPROVED
  ) {
    throw new Error(
      "Only approved awards can be accepted.",
    );
  }

  return updateAwardStatus(
    id,
    AwardStatus.ACCEPTED,
  );
}

export async function declineAward(
  id: string,
) {
  const existingAward =
    await findAwardById(id);

  if (!existingAward) {
    throw new Error(
      "Award not found.",
    );
  }

  if (
    existingAward.status !==
    AwardStatus.PENDING &&
    existingAward.status !==
    AwardStatus.APPROVED
  ) {
    throw new Error(
      "Only pending or approved awards can be declined.",
    );
  }

  return updateAwardStatus(
    id,
    AwardStatus.DECLINED,
  );
}

export async function cancelAward(
  id: string,
) {
  const existingAward =
    await findAwardById(id);

  if (!existingAward) {
    throw new Error(
      "Award not found.",
    );
  }

  if (
    existingAward.status ===
    AwardStatus.ACCEPTED ||
    existingAward.status ===
    AwardStatus.CANCELLED
  ) {
    throw new Error(
      "This award cannot be cancelled from its current status.",
    );
  }

  return updateAwardStatus(
    id,
    AwardStatus.CANCELLED,
  );
}

export async function finalizeAward(
  id: string,
) {
  const existingAward =
    await findAwardById(id);

  if (!existingAward) {
    throw new Error(
      "Award not found.",
    );
  }

  if (
    existingAward.status !==
    AwardStatus.ACCEPTED
  ) {
    throw new Error(
      "Only accepted awards can be finalized.",
    );
  }

  return existingAward;
}