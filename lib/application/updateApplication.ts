"use server";

import fs from "fs/promises";
import path from "path";

import { DocumentCategory } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/plain",
];

function sanitizeFileName(fileName: string) {
  return fileName.replace(
    /[^a-zA-Z0-9.-]/g,
    "_",
  );
}

export async function updateApplication(
  applicationId: string,
  formData: FormData,
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
      documents: true,
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
  // 6. ONLY DRAFT BIDS CAN BE EDITED
  // ========================================

  if (bid.status !== "DRAFT") {
    throw new Error(
      "This bid can no longer be edited.",
    );
  }

  // ========================================
  // 7. READ FORM DATA
  // ========================================

  const proposal = String(
    formData.get("proposal") ?? "",
  ).trim();

  if (!proposal) {
    throw new Error("Proposal is required.");
  }

  // ========================================
  // 8. READ FILES
  // ========================================

  const files = formData
    .getAll("documents")
    .filter(
      (item): item is File =>
        item instanceof File &&
        item.size > 0,
    );

  // ========================================
  // 9. VALIDATE FILES
  // ========================================

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `${file.name} exceeds the 10MB limit.`,
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error(
        `${file.name} file type is not allowed.`,
      );
    }
  }

  // ========================================
  // 10. UPDATE BID
  // ========================================
  //
  // The current Bid model has no "proposal"
  // field. The proposal text is stored in
  // Bid.summary.

  await prisma.bid.update({
    where: {
      id: bid.id,
    },
    data: {
      summary: proposal,
    },
  });

  // ========================================
  // 11. UPLOAD BID DOCUMENTS
  // ========================================

  if (files.length > 0) {
    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "bids",
      bid.id,
    );

    await fs.mkdir(uploadDirectory, {
      recursive: true,
    });

    for (const file of files) {
      const safeFileName = sanitizeFileName(
        file.name,
      );

      const fileName = `${Date.now()}-${safeFileName}`;

      const filePath = path.join(
        uploadDirectory,
        fileName,
      );

      const buffer = Buffer.from(
        await file.arrayBuffer(),
      );

      await fs.writeFile(
        filePath,
        buffer,
      );

      await prisma.bidDocument.create({
        data: {
          bid: {
            connect: {
              id: bid.id,
            },
          },
          name: file.name,
          category: DocumentCategory.OTHER,
          fileUrl: `/uploads/bids/${bid.id}/${fileName}`,
          mimeType: file.type || null,
          fileSize: file.size,
        },
      });
    }
  }

  // ========================================
  // 12. RECORD BID ACTIVITY
  // ========================================

  await prisma.applicationActivity.create({
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
      action: "BID_UPDATED",
      description: "Vendor updated bid.",
    },
  });

  // ========================================
  // 13. REDIRECT BACK TO BID
  // ========================================

  redirect(
    `/dashboard/vendor/bids/${bid.id}`,
  );
}