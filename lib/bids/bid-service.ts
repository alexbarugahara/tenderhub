import { BidStatus, Prisma } from "@prisma/client";

import {
  createBid,
  deleteBid,
  findBidById,
  findBidByNumber,
  listBids,
  updateBid,
  updateBidStatus,
} from "@/lib/db/repositories/bid.repository";

export interface CreateBidInput {
  solicitationId: string;
  lotId: string;
  vendorId: string;
  submittedById: string;
  currencyId: string;
  bidNumber: string;
  status?: BidStatus;
  title?: string | null;
  summary?: string | null;
  totalAmount?: number | null;
}

export interface UpdateBidInput {
  lotId?: string;
  vendorId?: string;
  submittedById?: string;
  currencyId?: string;
  bidNumber?: string;
  status?: BidStatus;
  title?: string | null;
  summary?: string | null;
  totalAmount?: number | null;
  submittedAt?: Date | null;
  lockedAt?: Date | null;
  withdrawalReason?: string | null;
}

export interface ListBidsInput {
  solicitationId?: string;
  lotId?: string;
  vendorId?: string;
  status?: BidStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

function normalizeRequiredString(value: string): string {
  return value.trim();
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
): Prisma.Decimal | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  return new Prisma.Decimal(value);
}

function normalizeDate(
  value?: Date | null,
): Date | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  return value instanceof Date ? value : new Date(value);
}

export async function getBidById(id: string) {
  return findBidById(id);
}

export async function getBidByNumber(
  solicitationId: string,
  bidNumber: string,
) {
  return findBidByNumber(
    solicitationId,
    normalizeRequiredString(bidNumber),
  );
}

export async function createNewBid(
  input: CreateBidInput,
) {
  const solicitationId = normalizeRequiredString(
    input.solicitationId,
  );

  const lotId = normalizeRequiredString(input.lotId);

  if (!lotId) {
    throw new Error("A lot is required for every bid.");
  }

  const bidNumber = normalizeRequiredString(
    input.bidNumber,
  );

  const existingBid = await findBidByNumber(
    solicitationId,
    bidNumber,
  );

  if (existingBid) {
    throw new Error(
      "A bid with this number already exists for this solicitation.",
    );
  }

  const data: Prisma.BidCreateInput = {
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

    vendor: {
      connect: {
        id: input.vendorId,
      },
    },

    submittedBy: {
      connect: {
        id: input.submittedById,
      },
    },

    currency: {
      connect: {
        id: input.currencyId,
      },
    },

    bidNumber,

    status:
      input.status ??
      BidStatus.DRAFT,

    title:
      normalizeOptionalString(input.title),

    summary:
      normalizeOptionalString(input.summary),

    totalAmount:
      input.totalAmount !== undefined &&
        input.totalAmount !== null
        ? new Prisma.Decimal(input.totalAmount)
        : new Prisma.Decimal(0),
  };

  return createBid(data);
}

export async function editBid(
  id: string,
  input: UpdateBidInput,
) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  let normalizedBidNumber: string | undefined;

  if (input.bidNumber !== undefined) {
    normalizedBidNumber =
      normalizeRequiredString(input.bidNumber);

    const existingByNumber =
      await findBidByNumber(
        existingBid.solicitationId,
        normalizedBidNumber,
      );

    if (
      existingByNumber &&
      existingByNumber.id !== id
    ) {
      throw new Error(
        "A bid with this number already exists for this solicitation.",
      );
    }
  }

  const data: Prisma.BidUpdateInput = {
    lot:
      input.lotId !== undefined
        ? {
          connect: {
            id: normalizeRequiredString(
              input.lotId,
            ),
          },
        }
        : undefined,

    vendor:
      input.vendorId !== undefined
        ? {
          connect: {
            id: input.vendorId,
          },
        }
        : undefined,

    submittedBy:
      input.submittedById !== undefined
        ? {
          connect: {
            id: input.submittedById,
          },
        }
        : undefined,

    currency:
      input.currencyId !== undefined
        ? {
          connect: {
            id: input.currencyId,
          },
        }
        : undefined,

    bidNumber:
      normalizedBidNumber,

    status:
      input.status,

    title:
      input.title !== undefined
        ? normalizeOptionalString(input.title)
        : undefined,

    summary:
      input.summary !== undefined
        ? normalizeOptionalString(input.summary)
        : undefined,

    totalAmount:
      input.totalAmount !== undefined
        ? normalizeAmount(input.totalAmount) ?? undefined
        : undefined,

    submittedAt:
      input.submittedAt !== undefined
        ? normalizeDate(input.submittedAt)
        : undefined,

    lockedAt:
      input.lockedAt !== undefined
        ? normalizeDate(input.lockedAt)
        : undefined,

    withdrawalReason:
      input.withdrawalReason !== undefined
        ? normalizeOptionalString(
          input.withdrawalReason,
        )
        : undefined,
  };

  return updateBid(id, data);
}

export async function changeBidStatus(
  id: string,
  status: BidStatus,
) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  return updateBidStatus(id, status);
}

export async function removeBid(id: string) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  return deleteBid(id);
}

export async function getBids(
  input: ListBidsInput = {},
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

  const skip = (page - 1) * pageSize;

  return listBids({
    solicitationId: input.solicitationId,
    lotId: input.lotId,
    vendorId: input.vendorId,
    status: input.status,
    search:
      input.search?.trim() || undefined,
    skip,
    take: pageSize,
  });
}

export async function submitBid(id: string) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  if (existingBid.status !== BidStatus.DRAFT) {
    throw new Error(
      "Only draft bids can be submitted.",
    );
  }

  return updateBidStatus(
    id,
    BidStatus.SUBMITTED,
  );
}

export async function withdrawBid(
  id: string,
  withdrawalReason?: string | null,
) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  if (
    existingBid.status !== BidStatus.SUBMITTED &&
    existingBid.status !== BidStatus.UNDER_REVIEW
  ) {
    throw new Error(
      "Only submitted or under-review bids can be withdrawn.",
    );
  }

  return updateBid(id, {
    status: BidStatus.WITHDRAWN,
    withdrawalReason:
      normalizeOptionalString(
        withdrawalReason,
      ),
  });
}

export async function startBidReview(id: string) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  if (existingBid.status !== BidStatus.SUBMITTED) {
    throw new Error(
      "Only submitted bids can enter review.",
    );
  }

  return updateBidStatus(
    id,
    BidStatus.UNDER_REVIEW,
  );
}

export async function markBidCompliant(id: string) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  if (
    existingBid.status !==
    BidStatus.UNDER_REVIEW
  ) {
    throw new Error(
      "Only bids under review can be marked compliant.",
    );
  }

  return updateBidStatus(
    id,
    BidStatus.COMPLIANT,
  );
}

export async function markBidNonCompliant(
  id: string,
) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  if (
    existingBid.status !==
    BidStatus.UNDER_REVIEW
  ) {
    throw new Error(
      "Only bids under review can be marked non-compliant.",
    );
  }

  return updateBidStatus(
    id,
    BidStatus.NON_COMPLIANT,
  );
}

export async function shortlistBid(id: string) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  if (
    existingBid.status !==
    BidStatus.COMPLIANT
  ) {
    throw new Error(
      "Only compliant bids can be shortlisted.",
    );
  }

  return updateBidStatus(
    id,
    BidStatus.SHORTLISTED,
  );
}

export async function markBidEvaluated(id: string) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  if (
    existingBid.status !==
    BidStatus.SHORTLISTED &&
    existingBid.status !==
    BidStatus.COMPLIANT
  ) {
    throw new Error(
      "Only shortlisted or compliant bids can be marked evaluated.",
    );
  }

  return updateBidStatus(
    id,
    BidStatus.EVALUATED,
  );
}

export async function rejectBid(id: string) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  if (
    existingBid.status ===
    BidStatus.WITHDRAWN ||
    existingBid.status ===
    BidStatus.AWARDED ||
    existingBid.status ===
    BidStatus.REJECTED
  ) {
    throw new Error(
      "This bid cannot be rejected from its current status.",
    );
  }

  return updateBidStatus(
    id,
    BidStatus.REJECTED,
  );
}

export async function awardBid(id: string) {
  const existingBid = await findBidById(id);

  if (!existingBid) {
    throw new Error("Bid not found.");
  }

  if (
    existingBid.status !==
    BidStatus.EVALUATED
  ) {
    throw new Error(
      "Only evaluated bids can be awarded.",
    );
  }

  return updateBidStatus(
    id,
    BidStatus.AWARDED,
  );
}