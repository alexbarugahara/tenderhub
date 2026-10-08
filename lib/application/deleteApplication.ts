"use server";

import fs from "fs/promises";
import path from "path";

import { BidStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function deleteApplication(bidId: string) {
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
  VALIDATE BID ID
  ============================================================
  */

  if (!bidId?.trim()) {
    throw new Error("Bid ID is required.");
  }

  const normalizedBidId = bidId.trim();

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
    },
  });

  if (!vendor) {
    redirect("/dashboard/vendor/profile");
  }

  /*
  ============================================================
  FIND BID
  ============================================================
  */

  const bid = await prisma.bid.findUnique({
    where: {
      id: normalizedBidId,
    },
    select: {
      id: true,
      vendorId: true,
      status: true,
    },
  });

  if (!bid) {
    throw new Error("Bid not found.");
  }

  /*
  ============================================================
  AUTHORIZATION
  ============================================================
  */

  if (bid.vendorId !== vendor.id) {
    throw new Error("Unauthorized.");
  }

  /*
  ============================================================
  BUSINESS RULE
  ============================================================

  Only submitted bids can be deleted.

  The database relationships use cascading deletes for:

    Bid
      ├── BidDocument
      ├── BidRequirementResponse
      ├── Evaluation
      ├── Award (when applicable, subject to relation rules)
      └── ApplicationActivity

  We therefore delete the bid itself rather than attempting
  to maintain obsolete application/document records.
  ============================================================
  */

  if (bid.status !== BidStatus.SUBMITTED) {
    throw new Error(
      "Only submitted bids can be deleted.",
    );
  }

  /*
  ============================================================
  DELETE DATABASE RECORD
  ============================================================
  */

  await prisma.bid.delete({
    where: {
      id: normalizedBidId,
    },
  });

  /*
  ============================================================
  DELETE UPLOADED FILES
  ============================================================

  Bid documents are stored under the bid-specific upload
  directory. File cleanup is deliberately performed after the
  database deletion so a filesystem failure does not prevent
  the bid from being removed from the database.
  ============================================================
  */

  const uploadDirectory = path.join(
    process.cwd(),
    "public",
    "uploads",
    "bids",
    normalizedBidId,
  );

  try {
    await fs.rm(uploadDirectory, {
      recursive: true,
      force: true,
    });
  } catch (error) {
    console.error(
      "Failed to delete bid files:",
      error,
    );
  }

  /*
  ============================================================
  REDIRECT
  ============================================================
  */

  redirect("/dashboard/vendor/bids");
}
