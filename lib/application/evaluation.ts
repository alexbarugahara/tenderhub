"use server";

import { redirect } from "next/navigation";

import {
  BidStatus,
  NotificationType,
  SubscriptionPlan,
} from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = [
  BidStatus.SUBMITTED,
  BidStatus.UNDER_REVIEW,
  BidStatus.SHORTLISTED,
  BidStatus.REJECTED,
] as const;

type ReviewStatus = (typeof ALLOWED_STATUSES)[number];

const PREMIUM_PLANS = [
  SubscriptionPlan.ORGANIZATION_PROFESSIONAL,
  SubscriptionPlan.ORGANIZATION_ENTERPRISE,
] as const;

/**
 * Update the review status of a bid.
 *
 * This function is retained under the legacy application
 * module name for compatibility with existing callers, but
 * operates entirely on the current Bid/Solicitation/Vendor
 * architecture.
 */
export async function updateApplicationStatus(
  applicationId: string,
  status: ReviewStatus,
) {
  // ========================================
  // 1. AUTHENTICATION
  // ========================================

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // ========================================
  // 2. AUTHORIZATION
  // ========================================

  if (session.user.role !== "ORGANIZATION") {
    redirect("/dashboard");
  }

  // ========================================
  // 3. VALIDATE STATUS
  // ========================================

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new Error("Invalid bid status.");
  }

  // ========================================
  // 4. FIND ORGANIZATION THROUGH MEMBERSHIP
  // ========================================

  const membership =
    await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
      },
      include: {
        organization: true,
      },
    });

  if (!membership) {
    redirect("/dashboard/organization");
  }

  const organization = membership.organization;

  // ========================================
  // 5. FIND ORGANIZATION SUBSCRIPTION
  // ========================================

  const subscription =
    await prisma.subscription.findFirst({
      where: {
        organizationId: organization.id,
        status: {
          in: ["ACTIVE", "TRIAL"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  const currentPlan =
    subscription?.plan ??
    SubscriptionPlan.ORGANIZATION_STARTER;

  // ========================================
  // 6. ENFORCE SHORTLISTING ACCESS
  // ========================================

  if (
    status === BidStatus.SHORTLISTED &&
    !PREMIUM_PLANS.includes(
      currentPlan as (typeof PREMIUM_PLANS)[number],
    )
  ) {
    throw new Error(
      "Shortlisting is available only on the Professional and Enterprise plans. Please upgrade your subscription to continue.",
    );
  }

  // ========================================
  // 7. FIND BID
  // ========================================

  const bid = await prisma.bid.findUnique({
    where: {
      id: applicationId,
    },
    include: {
      solicitation: true,
      vendor: true,
    },
  });

  if (!bid) {
    throw new Error("Bid not found.");
  }

  // ========================================
  // 8. VERIFY SOLICITATION OWNERSHIP
  // ========================================

  if (
    bid.solicitation.organizationId !==
    organization.id
  ) {
    throw new Error("Unauthorized.");
  }

  // ========================================
  // 9. PREVENT CHANGES TO FINALIZED BIDS
  // ========================================

  if (
    bid.status === BidStatus.AWARDED ||
    bid.status === BidStatus.REJECTED ||
    bid.status === BidStatus.WITHDRAWN
  ) {
    throw new Error(
      "This bid can no longer be reviewed.",
    );
  }

  // ========================================
  // 10. PREVENT SAME STATUS
  // ========================================

  if (bid.status === status) {
    throw new Error(`Bid is already ${status}.`);
  }

  // ========================================
  // 11. VALID STATUS TRANSITIONS
  // ========================================

  const validTransitions: Partial<
    Record<BidStatus, ReviewStatus[]>
  > = {
    [BidStatus.SUBMITTED]: [
      BidStatus.UNDER_REVIEW,
      BidStatus.REJECTED,
    ],

    [BidStatus.UNDER_REVIEW]: [
      BidStatus.SUBMITTED,
      BidStatus.SHORTLISTED,
      BidStatus.REJECTED,
    ],

    [BidStatus.SHORTLISTED]: [
      BidStatus.SUBMITTED,
      BidStatus.REJECTED,
    ],
  };

  const allowedTransitions =
    validTransitions[bid.status] ?? [];

  if (!allowedTransitions.includes(status)) {
    throw new Error(
      `Cannot change bid status from ${bid.status} to ${status}.`,
    );
  }

  // ========================================
  // 12. UPDATE BID, ACTIVITY, NOTIFICATION
  // ========================================

  await prisma.$transaction(async (tx) => {
    // ----------------------------------------
    // 12.1 UPDATE BID STATUS
    // ----------------------------------------

    await tx.bid.update({
      where: {
        id: bid.id,
      },
      data: {
        status,
      },
    });

    // ----------------------------------------
    // 12.2 RECORD ACTIVITY
    // ----------------------------------------

    await tx.applicationActivity.create({
      data: {
        bid: {
          connect: {
            id: bid.id,
          },
        },

        performedBy: {
          connect: {
            id: session.user.id,
          },
        },

        action: `BID_${status}`,

        description:
          `Organization changed bid status to ${status}.`,
      },
    });

    // ----------------------------------------
    // 12.3 SHORTLISTED NOTIFICATION
    // ----------------------------------------

    if (status === BidStatus.SHORTLISTED) {
      await tx.notification.create({
        data: {
          user: {
            connect: {
              id: bid.vendor.userId,
            },
          },

          title: "Bid Shortlisted",

          message:
            `Your bid for "${bid.solicitation.title}" has been shortlisted for further consideration.`,

          type: NotificationType.SUCCESS,

          link: `/dashboard/vendor/bids/${bid.id}`,
        },
      });
    }

    // ----------------------------------------
    // 12.4 REJECTED NOTIFICATION
    // ----------------------------------------

    if (status === BidStatus.REJECTED) {
      await tx.notification.create({
        data: {
          user: {
            connect: {
              id: bid.vendor.userId,
            },
          },

          title: "Bid Rejected",

          message:
            `Your bid for "${bid.solicitation.title}" was not selected.`,

          type: NotificationType.WARNING,

          link: `/dashboard/vendor/bids/${bid.id}`,
        },
      });
    }
  });

  // ========================================
  // 13. REDIRECT TO SOLICITATION
  // ========================================

  redirect(
    `/dashboard/organization/solicitations/${bid.solicitationId}`,
  );
}