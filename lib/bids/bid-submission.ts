import {
  BidStatus,
  SolicitationStatus,
} from "@prisma/client";

import {
  findBidById,
  updateBid,
} from "@/lib/db/repositories/bid.repository";

import {
  findSolicitationById,
} from "@/lib/db/repositories/solicitation.repository";

import {
  validateBidForSubmission,
} from "@/lib/bids/bid-validation";

export interface SubmitBidInput {
  bidId: string;
}

export interface BidSubmissionResult {
  success: boolean;
  bid: Awaited<ReturnType<typeof findBidById>>;
  message: string;
}

type ExistingBid = NonNullable<
  Awaited<ReturnType<typeof findBidById>>
>;

async function getBidSolicitation(
  bid: ExistingBid,
) {
  return findSolicitationById(
    bid.solicitationId,
  );
}

async function assertBidCanBeSubmitted(
  bid: ExistingBid,
): Promise<void> {
  if (bid.status !== BidStatus.DRAFT) {
    throw new Error(
      "Only draft bids can be submitted.",
    );
  }

  const solicitation =
    await getBidSolicitation(bid);

  if (!solicitation) {
    throw new Error(
      "The solicitation associated with this bid could not be found.",
    );
  }

  if (
    solicitation.status !==
    SolicitationStatus.OPEN
  ) {
    throw new Error(
      "This solicitation is not currently open for bid submissions.",
    );
  }

  if (
    solicitation.closingDate &&
    solicitation.closingDate <= new Date()
  ) {
    throw new Error(
      "The bid submission period for this solicitation has closed.",
    );
  }
}

function buildValidationInput(
  bid: ExistingBid,
) {
  return {
    solicitationId:
      bid.solicitationId,

    lotId:
      bid.lotId,

    vendorId:
      bid.vendorId,

    submittedById:
      bid.submittedById,

    currencyId:
      bid.currencyId,

    bidNumber:
      bid.bidNumber,

    status:
      bid.status,

    title:
      bid.title,

    summary:
      bid.summary,

    totalAmount:
      bid.totalAmount.toNumber(),
  };
}

export async function validateBidSubmission(
  bidId: string,
): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const bid = await findBidById(bidId);

  if (!bid) {
    return {
      valid: false,
      errors: ["Bid not found."],
    };
  }

  const errors: string[] = [];

  try {
    await assertBidCanBeSubmitted(bid);
  } catch (error) {
    errors.push(
      error instanceof Error
        ? error.message
        : "This bid cannot be submitted.",
    );
  }

  const validation =
    validateBidForSubmission(
      buildValidationInput(bid),
    );

  errors.push(
    ...validation.errors,
  );

  return {
    valid:
      errors.length === 0,

    errors: [
      ...new Set(errors),
    ],
  };
}

export async function submitBidForReview(
  input: SubmitBidInput,
): Promise<BidSubmissionResult> {
  const bid = await findBidById(
    input.bidId,
  );

  if (!bid) {
    throw new Error("Bid not found.");
  }

  await assertBidCanBeSubmitted(bid);

  const validation =
    validateBidForSubmission(
      buildValidationInput(bid),
    );

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(" "),
    );
  }

  const submittedAt =
    new Date();

  const updatedBid =
    await updateBid(
      input.bidId,
      {
        status:
          BidStatus.SUBMITTED,

        submittedAt,
      },
    );

  return {
    success: true,
    bid: updatedBid,
    message:
      "Bid submitted successfully.",
  };
}

export async function submitBid(
  bidId: string,
): Promise<BidSubmissionResult> {
  return submitBidForReview({
    bidId,
  });
}

export async function lockBid(
  bidId: string,
): Promise<BidSubmissionResult> {
  const bid =
    await findBidById(bidId);

  if (!bid) {
    throw new Error("Bid not found.");
  }

  if (
    bid.status !==
    BidStatus.SUBMITTED
  ) {
    throw new Error(
      "Only submitted bids can be locked.",
    );
  }

  if (bid.lockedAt) {
    throw new Error(
      "This bid has already been locked.",
    );
  }

  const lockedAt =
    new Date();

  const updatedBid =
    await updateBid(
      bidId,
      {
        lockedAt,
      },
    );

  return {
    success: true,
    bid: updatedBid,
    message:
      "Bid locked successfully.",
  };
}

export async function isBidSubmissionOpen(
  bidId: string,
): Promise<boolean> {
  const bid =
    await findBidById(bidId);

  if (!bid) {
    return false;
  }

  if (
    bid.status !==
    BidStatus.DRAFT
  ) {
    return false;
  }

  const solicitation =
    await getBidSolicitation(bid);

  if (!solicitation) {
    return false;
  }

  if (
    solicitation.status !==
    SolicitationStatus.OPEN
  ) {
    return false;
  }

  if (
    solicitation.closingDate &&
    solicitation.closingDate <=
      new Date()
  ) {
    return false;
  }

  return true;
}