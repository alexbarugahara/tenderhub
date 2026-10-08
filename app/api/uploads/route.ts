import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    ".pptx",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/zip": ".zip",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function sanitizeFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();

  const baseName = path
    .basename(fileName, path.extname(fileName))
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return {
    baseName: baseName || "file",
    extension,
  };
}

function getSafeExtension(file: File) {
  const mimeExtension = EXTENSION_BY_MIME_TYPE[file.type];

  if (mimeExtension) {
    return mimeExtension;
  }

  return sanitizeFileName(file.name).extension;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    const singleFile = formData.get("file");

    if (
      singleFile instanceof File &&
      !files.some((file) => file.name === singleFile.name)
    ) {
      files.push(singleFile);
    }

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No file was provided",
        },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: "A maximum of 10 files can be uploaded at once",
        },
        { status: 400 }
      );
    }

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    await fs.mkdir(uploadDirectory, {
      recursive: true,
    });

    const uploadedFiles: Array<{
      name: string;
      originalName: string;
      url: string;
      mimeType: string;
      fileSize: number;
    }> = [];

    for (const file of files) {
      if (file.size === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `The file "${file.name}" is empty`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `The file "${file.name}" exceeds the 20 MB size limit`,
          },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `The file type "${file.type || "unknown"}" is not allowed`,
          },
          { status: 400 }
        );
      }

      const { baseName } = sanitizeFileName(file.name);
      const extension = getSafeExtension(file);

      const uniqueName = `${baseName}-${crypto.randomUUID()}${extension}`;
      const filePath = path.join(uploadDirectory, uniqueName);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      await fs.writeFile(filePath, buffer);

      uploadedFiles.push({
        name: uniqueName,
        originalName: file.name,
        url: `/uploads/${uniqueName}`,
        mimeType: file.type,
        fileSize: file.size,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message:
          uploadedFiles.length === 1
            ? "File uploaded successfully"
            : "Files uploaded successfully",
        data:
          uploadedFiles.length === 1
            ? uploadedFiles[0]
            : uploadedFiles,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file",
      },
      { status: 500 }
    );
  }
}