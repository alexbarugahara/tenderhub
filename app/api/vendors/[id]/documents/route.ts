import { NextRequest, NextResponse } from "next/server";
import {
  DocumentCategory,
  DocumentStatus,
  UserRole,
} from "@prisma/client";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function isAdmin(role: unknown): boolean {
  return role === UserRole.ADMIN;
}

async function getSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

async function getVendor(vendorId: string) {
  return prisma.vendor.findUnique({
    where: {
      id: vendorId,
    },
    select: {
      id: true,
      userId: true,
    },
  });
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);
}

function isValidDocumentCategory(
  value: string,
): value is DocumentCategory {
  return Object.values(DocumentCategory).includes(
    value as DocumentCategory,
  );
}

function parseOptionalDate(
  value: FormDataEntryValue | null,
): Date | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/* -------------------------------------------------------------------------- */
/* GET — List vendor documents                                                */
/* -------------------------------------------------------------------------- */

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const { id: vendorId } = await context.params;

    if (!vendorId) {
      return NextResponse.json(
        {
          error: "Vendor ID is required.",
        },
        { status: 400 },
      );
    }

    const vendor = await getVendor(vendorId);

    if (!vendor) {
      return NextResponse.json(
        {
          error: "Vendor not found.",
        },
        { status: 404 },
      );
    }

    const isOwner = user.id === vendor.userId;
    const admin = isAdmin(user.role);

    if (!isOwner && !admin) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to access these documents.",
        },
        { status: 403 },
      );
    }

    const documents = await prisma.vendorDocument.findMany({
      where: {
        vendorId,
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    /*
     * VendorDocument is the physical document record.
     *
     * VendorApplicationEvidence is the verification/evidence record
     * that connects a document to a vendor onboarding requirement.
     *
     * We deliberately do not use the retired VendorCompliance model.
     */
    const application = await prisma.vendorApplication.findUnique({
      where: {
        userId: vendor.userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!application) {
      return NextResponse.json({
        documents: documents.map((document) => ({
          ...document,
          evidence: [],
        })),
      });
    }

    const evidence = await prisma.vendorApplicationEvidence.findMany({
      where: {
        applicationId: application.id,
        fileUrl: {
          in: documents.map((document) => document.fileUrl),
        },
      },
      include: {
        requirement: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            required: true,
            category: true,
            status: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
    });

    const evidenceByFileUrl = new Map(
      evidence.map((item) => [item.fileUrl, item]),
    );

    const enrichedDocuments = documents.map((document) => ({
      ...document,
      evidence: evidenceByFileUrl.get(document.fileUrl) ?? null,
    }));

    return NextResponse.json({
      documents: enrichedDocuments,
      application: {
        id: application.id,
        status: application.status,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/vendors/[id]/documents failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to load vendor documents.",
      },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* POST — Upload vendor onboarding evidence                                   */
/* -------------------------------------------------------------------------- */

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  let writtenFilePath: string | null = null;

  try {
    /* ---------------------------------------------------------------------- */
    /* Authentication                                                         */
    /* ---------------------------------------------------------------------- */

    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Authentication required.",
        },
        { status: 401 },
      );
    }

    const { id: vendorId } = await context.params;

    if (!vendorId) {
      return NextResponse.json(
        {
          error: "Vendor ID is required.",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Vendor authorization                                                   */
    /* ---------------------------------------------------------------------- */

    const vendor = await getVendor(vendorId);

    if (!vendor) {
      return NextResponse.json(
        {
          error: "Vendor not found.",
        },
        { status: 404 },
      );
    }

    const isOwner = user.id === vendor.userId;
    const admin = isAdmin(user.role);

    if (!isOwner && !admin) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to upload documents for this vendor.",
        },
        { status: 403 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Read multipart form data                                               */
    /* ---------------------------------------------------------------------- */

    const formData = await request.formData();

    const file = formData.get("file");
    const requirementId = formData.get("requirementId");
    const documentCategory = formData.get("documentCategory");
    const name = formData.get("name");
    const issueDateValue = formData.get("issueDate");
    const expiryDateValue = formData.get("expiryDate");

    /* ---------------------------------------------------------------------- */
    /* Validate requirement                                                   */
    /* ---------------------------------------------------------------------- */

    if (
      typeof requirementId !== "string" ||
      !requirementId.trim()
    ) {
      return NextResponse.json(
        {
          error: "Verification requirement is required.",
        },
        { status: 400 },
      );
    }

    const requirement = await prisma.vendorRequirement.findUnique({
      where: {
        id: requirementId.trim(),
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        active: true,
        required: true,
        allowedDocumentCategories: true,
      },
    });

    if (!requirement) {
      return NextResponse.json(
        {
          error:
            "The selected verification requirement does not exist.",
        },
        { status: 400 },
      );
    }

    if (!requirement.active) {
      return NextResponse.json(
        {
          error:
            "The selected verification requirement is no longer active.",
        },
        { status: 400 },
      );
    }

    /*
     * This endpoint is specifically for TenderHub platform/vendor
     * onboarding requirements.
     *
     * Solicitation-specific qualification documents are handled
     * separately by the procurement workflow.
     */
    if (!requirement.required) {
      return NextResponse.json(
        {
          error:
            "The selected requirement is not configured as a required TenderHub vendor onboarding requirement.",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Find vendor application                                                */
    /* ---------------------------------------------------------------------- */

    const application =
      await prisma.vendorApplication.findUnique({
        where: {
          userId: vendor.userId,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!application) {
      return NextResponse.json(
        {
          error:
            "A vendor onboarding application has not been created yet.",
        },
        { status: 400 },
      );
    }

    /*
     * The application requirement is a snapshot of the requirement
     * assigned to this particular application.
     *
     * We must attach evidence to this application requirement rather
     * than directly to VendorRequirement.
     */
    const applicationRequirement =
      await prisma.vendorApplicationRequirement.findUnique({
        where: {
          applicationId_requirementId: {
            applicationId: application.id,
            requirementId: requirement.id,
          },
        },
        select: {
          id: true,
          applicationId: true,
          requirementId: true,
          status: true,
        },
      });

    if (!applicationRequirement) {
      return NextResponse.json(
        {
          error:
            "The selected requirement has not been assigned to this vendor application.",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Validate document category                                             */
    /* ---------------------------------------------------------------------- */

    if (
      typeof documentCategory !== "string" ||
      !documentCategory.trim()
    ) {
      return NextResponse.json(
        {
          error: "Document category is required.",
        },
        { status: 400 },
      );
    }

    if (!isValidDocumentCategory(documentCategory)) {
      return NextResponse.json(
        {
          error: "Invalid document category.",
        },
        { status: 400 },
      );
    }

    /*
     * Never trust the category supplied by the browser.
     *
     * The administrator configures the permitted categories on
     * VendorRequirement.allowedDocumentCategories.
     */
    if (
      !requirement.allowedDocumentCategories.includes(
        documentCategory,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "This document category is not allowed for the selected verification requirement.",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Validate file                                                          */
    /* ---------------------------------------------------------------------- */

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "A document file is required.",
        },
        { status: 400 },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          error: "The uploaded file is empty.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "The maximum document size is 10 MB.",
        },
        { status: 400 },
      );
    }

    if (
      file.type &&
      !ALLOWED_MIME_TYPES.has(file.type)
    ) {
      return NextResponse.json(
        {
          error: "This file type is not supported.",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Validate document name                                                 */
    /* ---------------------------------------------------------------------- */

    const documentName =
      typeof name === "string" && name.trim()
        ? name.trim()
        : documentCategory
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (character) =>
              character.toUpperCase(),
            );

    if (!documentName) {
      return NextResponse.json(
        {
          error: "Document name is required.",
        },
        { status: 400 },
      );
    }

    if (documentName.length > 200) {
      return NextResponse.json(
        {
          error:
            "Document name cannot exceed 200 characters.",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Validate dates                                                         */
    /* ---------------------------------------------------------------------- */

    const issuedAt = parseOptionalDate(
      issueDateValue,
    );

    const expiryDate = parseOptionalDate(
      expiryDateValue,
    );

    if (
      typeof issueDateValue === "string" &&
      issueDateValue.trim() &&
      !issuedAt
    ) {
      return NextResponse.json(
        {
          error: "Invalid issue date.",
        },
        { status: 400 },
      );
    }

    if (
      typeof expiryDateValue === "string" &&
      expiryDateValue.trim() &&
      !expiryDate
    ) {
      return NextResponse.json(
        {
          error: "Invalid expiry date.",
        },
        { status: 400 },
      );
    }

    if (
      issuedAt &&
      expiryDate &&
      expiryDate < issuedAt
    ) {
      return NextResponse.json(
        {
          error:
            "Expiry date cannot be earlier than the issue date.",
        },
        { status: 400 },
      );
    }

    /* ---------------------------------------------------------------------- */
    /* Save physical file                                                     */
    /* ---------------------------------------------------------------------- */

    const safeName = sanitizeFileName(file.name);

    const extension = path.extname(safeName);

    const baseName = path.basename(
      safeName,
      extension,
    );

    const uniqueName =
      `${baseName || "document"}-${Date.now()}-${crypto.randomUUID()}${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "vendors",
      vendorId,
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    writtenFilePath = path.join(
      uploadDirectory,
      uniqueName,
    );

    const fileBuffer = Buffer.from(
      await file.arrayBuffer(),
    );

    await writeFile(
      writtenFilePath,
      fileBuffer,
    );

    const fileUrl =
      `/uploads/vendors/${vendorId}/${uniqueName}`;

    /* ---------------------------------------------------------------------- */
    /* Create document + evidence atomically                                  */
    /* ---------------------------------------------------------------------- */

    const result = await prisma.$transaction(
      async (tx) => {
        const document =
          await tx.vendorDocument.create({
            data: {
              vendorId,
              name: documentName,
              category: documentCategory,
              fileUrl,
              mimeType:
                file.type ||
                "application/octet-stream",
              fileSize: file.size,
              status: DocumentStatus.PENDING,
              issuedAt,
              expiryDate,
            },
          });

        /*
         * Evidence is deliberately created as PENDING.
         *
         * Uploading a document does NOT mean the requirement
         * has been satisfied. An administrator must review it.
         */
        const evidence =
          await tx.vendorApplicationEvidence.create({
            data: {
              applicationId: application.id,
              requirementId:
                applicationRequirement.id,
              name: documentName,
              category: documentCategory,
              fileUrl,
              mimeType:
                file.type ||
                "application/octet-stream",
              fileSize: file.size,
              status: "PENDING",
              issuedAt,
              expiryDate,
            },
            include: {
              requirement: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  required: true,
                  status: true,
                },
              },
            },
          });

        /*
         * Uploading evidence means the vendor has submitted
         * something for review.
         *
         * It must NOT become SATISFIED automatically.
         */
        if (
          applicationRequirement.status ===
            "OUTSTANDING" ||
          applicationRequirement.status ===
            "REJECTED" ||
          applicationRequirement.status ===
            "NEEDS_INFORMATION"
        ) {
          await tx.vendorApplicationRequirement.update({
            where: {
              id: applicationRequirement.id,
            },
            data: {
              status: "SUBMITTED",
              notes: null,
              reviewedAt: null,
              reviewedById: null,
            },
          });
        }

        return {
          document,
          evidence,
        };
      },
    );

    /* ---------------------------------------------------------------------- */
    /* Success                                                                */
    /* ---------------------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          "Evidence uploaded successfully and submitted for verification.",

        document: result.document,

        evidence: {
          id: result.evidence.id,
          status: result.evidence.status,
          requirementId:
            result.evidence.requirementId,
          received: true,
          pendingVerification: true,
        },

        requirement: {
          id: requirement.id,
          code: requirement.code,
          name: requirement.name,
          description: requirement.description,
        },

        application: {
          id: application.id,
          status: application.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    /* ---------------------------------------------------------------------- */
    /* Remove orphaned physical file if DB operation failed                  */
    /* ---------------------------------------------------------------------- */

    if (writtenFilePath) {
      try {
        await unlink(writtenFilePath);
      } catch (cleanupError) {
        console.error(
          "Failed to remove orphaned uploaded file:",
          cleanupError,
        );
      }
    }

    console.error(
      "POST /api/vendors/[id]/documents failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to upload vendor evidence.",
      },
      { status: 500 },
    );
  }
}