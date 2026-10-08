"use server";

import {
  BidStatus,
  NotificationType,
} from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function withdrawApplication(
  applicationId: string,
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

  if (session.user.role !== "VENDOR") {
    redirect("/dashboard");
  }

  // ========================================
  // 3. FIND VENDOR
  // ========================================

  const vendor = await prisma.vendor.findUnique({
    where: {
      userId: session.user.id,
    },
  });

  if (!vendor) {
    redirect("/dashboard/vendor/profile");
  }

  // ========================================
  // 4. FIND BID
  // ========================================

  const bid = await prisma.bid.findUnique({
    where: {
      id: applicationId,
    },
    include: {
      solicitation: true,
    },
  });

  if (!bid) {
    throw new Error("Bid not found.");
  }

  // ========================================
  // 5. SECURITY CHECK
  // ========================================

  if (bid.vendorId !== vendor.id) {
    throw new Error("Unauthorized.");
  }

  // ========================================
  // 6. ONLY WITHDRAW SUBMITTED BIDS
  // ========================================

  if (bid.status !== BidStatus.SUBMITTED) {
    throw new Error(
      "This bid can no longer be withdrawn.",
    );
  }

  // ========================================
  // 7. WITHDRAW BID
  // ========================================

  await prisma.$transaction(async (tx) => {
    await tx.bid.update({
      where: {
        id: bid.id,
      },
      data: {
        status: BidStatus.WITHDRAWN,
      },
    });

    // ======================================
    // 8. RECORD ACTIVITY
    // ======================================

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

        action: "BID_WITHDRAWN",

        description:
          "Vendor withdrew bid.",
      },
    });

    // ======================================
    // 9. NOTIFY VENDOR
    // ======================================

    await tx.notification.create({
      data: {
        user: {
          connect: {
            id: session.user.id,
          },
        },

        title: "Bid Withdrawn",

        message:
          `Your bid for "${bid.solicitation.title}" has been successfully withdrawn.`,

        type: NotificationType.INFO,

        link: `/dashboard/vendor/bids/${bid.id}`,
      },
    });
  });

  // ========================================
  // 10. REDIRECT
  // ========================================

  redirect(
    `/dashboard/vendor/bids/${bid.id}`,
  );
}