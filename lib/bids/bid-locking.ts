import { BidStatus } from "@prisma/client";

import {
  findBidById,
  updateBid,
} from "@/lib/db/repositories/bid.repository";

export interface BidLockResult {
  success: boolean;
  bid: Awaited<ReturnType<typeof findBidById>>;
  message: string;
}

export async function getBidLockStatus(
  bidId: string,
): Promise<{
  exists: boolean;
  locked: boolean;
  lockedAt: Date | null;
}> {
  const bid = await findBidById(bidId);

  if (!bid) {
    return {
      exists: false,
      locked: false,
      lockedAt: null,
    };
  }

  return {
    exists: true,
    locked: Boolean(bid.lockedAt),
    lockedAt: bid.lockedAt ?? null,
  };
}

export async function isBidLocked(
  bidId: string,
): Promise<boolean> {
  const bid = await findBidById(bidId);

  if (!bid) {
    return false;
  }

  return Boolean(bid.lockedAt);
}

export async function assertBidNotLocked(
  bidId: string,
): Promise<
  NonNullable<
    Awaited<ReturnType<typeof findBidById>>
  >
> {
  const bid = await findBidById(bidId);

  if (!bid) {
    throw new Error("Bid not found.");
  }

  if (bid.lockedAt) {
    throw new Error(
      "This bid is locked and can no longer be modified.",
    );
  }

  return bid;
}

export async function lockBid(
  bidId: string,
): Promise<BidLockResult> {
  const bid = await findBidById(bidId);

  if (!bid) {
    throw new Error("Bid not found.");
  }

  if (bid.lockedAt) {
    throw new Error(
      "This bid has already been locked.",
    );
  }

  if (bid.status !== BidStatus.SUBMITTED) {
    throw new Error(
      "Only submitted bids can be locked.",
    );
  }

  const lockedAt = new Date();

  const updatedBid = await updateBid(
    bidId,
    {
      lockedAt,
    },
  );

  return {
    success: true,
    bid: updatedBid,
    message: "Bid locked successfully.",
  };
}

export async function unlockBid(
  bidId: string,
): Promise<BidLockResult> {
  const bid = await findBidById(bidId);

  if (!bid) {
    throw new Error("Bid not found.");
  }

  if (!bid.lockedAt) {
    throw new Error(
      "This bid is not currently locked.",
    );
  }

  if (
    bid.status === BidStatus.AWARDED ||
    bid.status === BidStatus.REJECTED ||
    bid.status === BidStatus.WITHDRAWN
  ) {
    throw new Error(
      "Awarded, rejected, or withdrawn bids cannot be unlocked.",
    );
  }

  const updatedBid = await updateBid(
    bidId,
    {
      lockedAt: null,
    },
  );

  return {
    success: true,
    bid: updatedBid,
    message: "Bid unlocked successfully.",
  };
}

export async function assertBidCanBeEdited(
  bidId: string,
): Promise<
  NonNullable<
    Awaited<ReturnType<typeof findBidById>>
  >
> {
  const bid = await assertBidNotLocked(bidId);

  if (bid.status !== BidStatus.DRAFT) {
    throw new Error(
      "Only draft bids can be edited.",
    );
  }

  return bid;
}

export async function assertBidCanBeSubmitted(
  bidId: string,
): Promise<
  NonNullable<
    Awaited<ReturnType<typeof findBidById>>
  >
> {
  const bid = await assertBidNotLocked(bidId);

  if (bid.status !== BidStatus.DRAFT) {
    throw new Error(
      "Only draft bids can be submitted.",
    );
  }

  return bid;
}

export async function assertBidCanBeWithdrawn(
  bidId: string,
): Promise<
  NonNullable<
    Awaited<ReturnType<typeof findBidById>>
  >
> {
  const bid = await findBidById(bidId);

  if (!bid) {
    throw new Error("Bid not found.");
  }

  if (bid.lockedAt) {
    throw new Error(
      "This bid is locked and cannot be withdrawn.",
    );
  }

  if (
    bid.status !== BidStatus.SUBMITTED &&
    bid.status !== BidStatus.UNDER_REVIEW
  ) {
    throw new Error(
      "Only submitted or under-review bids can be withdrawn.",
    );
  }

  return bid;
}

export function hasBidBeenLocked(
  bid: {
    lockedAt: Date | null;
  },
): boolean {
  return Boolean(bid.lockedAt);
}