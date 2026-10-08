"use server";

import { BidStatus, LotStatus, SolicitationStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function createApplication(
  solicitationId: string,
  lotId?: string,
) {
  /*
  ============================================================
  AUTHENTICATION
  ============================================================
  */

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  if (session.user.role !== "VENDOR") {
    redirect("/dashboard");
  }

  const userId = session.user.id;

  /*
  ============================================================
  VALIDATE SOLICITATION ID
  ============================================================
  */

  if (!solicitationId?.trim()) {
    throw new Error("Solicitation ID is required.");
  }

  const normalizedSolicitationId = solicitationId.trim();
  const normalizedLotId = lotId?.trim() || undefined;

  /*
  ============================================================
  FIND VENDOR
  ============================================================
  */

  const vendor = await prisma.vendor.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      companyName: true,
    },
  });

  if (!vendor) {
    redirect("/dashboard/vendor/profile");
  }

  /*
  ============================================================
  FIND SOLICITATION
  ============================================================
  */

  const solicitation = await prisma.solicitation.findUnique({
    where: {
      id: normalizedSolicitationId,
    },
    select: {
      id: true,
      title: true,
      solicitationNumber: true,
      status: true,
      closingDate: true,
      applicationFeeRequired: true,
      applicationFeeAmount: true,
      currency: {
        select: {
          code: true,
        },
      },
      lots: {
        where: {
          status: LotStatus.OPEN,
        },
        select: {
          id: true,
        },
        orderBy: {
          number: "asc",
        },
      },
    },
  });

  if (!solicitation) {
    throw new Error("Solicitation not found.");
  }

  /*
  ============================================================
  SOLICITATION ELIGIBILITY
  ============================================================

  A vendor can start a bid only while the solicitation is
  officially OPEN and, when a closing date exists, before the
  closing date.
  ============================================================
  */

  if (solicitation.status !== SolicitationStatus.OPEN) {
    throw new Error(
      "This solicitation is not currently accepting bids.",
    );
  }

  if (
    solicitation.closingDate &&
    new Date() >= solicitation.closingDate
  ) {
    throw new Error("The bidding deadline has passed.");
  }

  /*
  ============================================================
  DETERMINE LOT
  ============================================================
  */

  let selectedLotId = normalizedLotId;

  if (selectedLotId) {
    const requestedLot = solicitation.lots.find(
      (lot) => lot.id === selectedLotId,
    );

    if (!requestedLot) {
      throw new Error(
        "The selected lot is not available for bidding.",
      );
    }
  } else {
    if (solicitation.lots.length !== 1) {
      throw new Error(
        "A lot must be selected before starting a bid.",
      );
    }

    selectedLotId = solicitation.lots[0].id;
  }

  /*
  ============================================================
  CHECK EXISTING BID
  ============================================================

  One vendor can have only one bid for a solicitation lot.

  Existing bid:
    DRAFT         → continue editing
    SUBMITTED     → open bid
    UNDER_REVIEW  → open bid
    COMPLIANT     → open bid
    NON_COMPLIANT → open bid
    SHORTLISTED   → open bid
    EVALUATED     → open bid
    WITHDRAWN     → open bid
    REJECTED      → open bid
    AWARDED       → open bid

  The database unique constraint provides an additional
  protection against duplicate bids.
  ============================================================
  */

  const existingBid = await prisma.bid.findUnique({
    where: {
      vendorId_solicitationId_lotId: {
        vendorId: vendor.id,
        solicitationId: solicitation.id,
        lotId: selectedLotId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (existingBid) {
    if (existingBid.status === BidStatus.DRAFT) {
      redirect(
        `/dashboard/vendor/bids/${existingBid.id}/edit`,
      );
    }

    redirect(`/dashboard/vendor/bids/${existingBid.id}`);
  }

  /*
  ============================================================
  CREATE DRAFT BID
  ============================================================

  This action ONLY creates the draft.

  It does NOT:

    - submit the bid
    - upload documents
    - process payment
    - mark any fee as paid
    - evaluate the bid
    - shortlist the vendor
    - award the solicitation

  The bid starts as DRAFT.
  ============================================================
  */

  const bidNumber = `BID-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  const bid = await prisma.bid.create({
    data: {
      solicitationId: solicitation.id,
      lotId: selectedLotId,
      vendorId: vendor.id,
      submittedById: userId,
      bidNumber,
      status: BidStatus.DRAFT,
      totalAmount: 0,
    },
  });

  /*
  ============================================================
  CREATE BID ACTIVITY
  ============================================================
  */

  await prisma.applicationActivity.create({
    data: {
      bidId: bid.id,
      performedById: userId,
      action: "CREATE",
      description: `Vendor started a draft bid for solicitation ${solicitation.solicitationNumber}.`,
    },
  });

  /*
  ============================================================
  REDIRECT TO BID EDIT PAGE
  ============================================================
  */

  redirect(`/dashboard/vendor/bids/${bid.id}/edit`);
}
