import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getSelectedOrganizationId } from "@/components/layout/organization-switcher-actions";
import { OrganizationDocumentCategory } from "@prisma/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const organizationId = await getSelectedOrganizationId(session.user.id);

    if (!organizationId) {
      return NextResponse.json(
        { error: "No organization selected." },
        { status: 400 }
      );
    }

    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have access to this organization." },
        { status: 403 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      include: {
        verification: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found." },
        { status: 404 }
      );
    }

    const verificationStatus = organization.verification?.status;

    if (
      verificationStatus === "SUBMITTED" ||
      verificationStatus === "UNDER_REVIEW" ||
      verificationStatus === "APPROVED"
    ) {
      return NextResponse.json(
        {
          error:
            "Documents cannot be changed while the verification application is locked.",
        },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const categoryValue = formData.get("category");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a file to upload." },
        { status: 400 }
      );
    }

    if (typeof categoryValue !== "string" || !categoryValue) {
      return NextResponse.json(
        { error: "Document category is required." },
        { status: 400 }
      );
    }

    if (
      !Object.values(OrganizationDocumentCategory).includes(
        categoryValue as OrganizationDocumentCategory
      )
    ) {
      return NextResponse.json(
        { error: "Invalid document category." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The selected file is empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size cannot exceed 10 MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload PDF, JPG, PNG, DOC, or DOCX.",
        },
        { status: 400 }
      );
    }

    const originalFileName = sanitizeFileName(file.name);
    const extension = path.extname(originalFileName);
    const baseName = path.basename(originalFileName, extension);

    const storedFileName = `${baseName}-${randomUUID()}${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "organization-verification",
      organizationId
    );

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const filePath = path.join(uploadDirectory, storedFileName);

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, fileBuffer);

    const fileUrl = `/uploads/organization-verification/${organizationId}/${storedFileName}`;

    const document = await prisma.organizationDocument.create({
      data: {
        organizationId,
        name: file.name,
        category: categoryValue as OrganizationDocumentCategory,
        fileUrl,
        mimeType: file.type || null,
        fileSize: file.size,
        status: "PENDING",
      },
    });

    if (!organization.verification) {
      await prisma.organizationVerification.create({
        data: {
          organizationId,
          status: "DRAFT",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        document,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/organization/verification/documents error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to upload verification document.",
      },
      { status: 500 }
    );
  }
}