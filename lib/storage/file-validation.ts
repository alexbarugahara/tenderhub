export type FileValidationOptions = {
  maxSizeBytes?: number;
  allowedMimeTypes?: readonly string[];
  allowedExtensions?: readonly string[];
};

export type FileValidationResult = {
  valid: boolean;
  errors: string[];
};

export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const DEFAULT_ALLOWED_MIME_TYPES = [
  "application/pdf",

  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  "text/csv",
  "text/plain",

  "image/jpeg",
  "image/png",
  "image/webp",

  "application/zip",
] as const;

export const DEFAULT_ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".zip",
] as const;

function normalizeExtension(extension: string): string {
  const value = extension.trim().toLowerCase();

  return value.startsWith(".")
    ? value
    : `.${value}`;
}

function getFileExtension(fileName: string): string {
  const normalized = fileName.trim().toLowerCase();
  const lastDot = normalized.lastIndexOf(".");

  if (lastDot === -1) {
    return "";
  }

  return normalized.slice(lastDot);
}

function normalizeMimeType(
  mimeType?: string | null,
): string {
  return mimeType?.trim().toLowerCase() ?? "";
}

function validateFileName(fileName: string): string[] {
  const errors: string[] = [];

  const normalized = fileName.trim();

  if (!normalized) {
    errors.push("File name is required.");
    return errors;
  }

  if (normalized.length > 255) {
    errors.push("File name must not exceed 255 characters.");
  }

  if (normalized.includes("\0")) {
    errors.push("File name contains an invalid character.");
  }

  if (normalized === "." || normalized === "..") {
    errors.push("Invalid file name.");
  }

  return errors;
}

export function validateFileSize(
  size: number,
  maxSizeBytes = DEFAULT_MAX_FILE_SIZE,
): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(size) || size < 0) {
    errors.push("File size must be a valid non-negative number.");
    return errors;
  }

  if (size === 0) {
    errors.push("File cannot be empty.");
  }

  if (size > maxSizeBytes) {
    errors.push(
      `File size must not exceed ${formatFileSize(maxSizeBytes)}.`,
    );
  }

  return errors;
}

export function validateMimeType(
  mimeType: string | null | undefined,
  allowedMimeTypes: readonly string[] = DEFAULT_ALLOWED_MIME_TYPES,
): string[] {
  const errors: string[] = [];
  const normalizedMimeType = normalizeMimeType(mimeType);

  if (!normalizedMimeType) {
    errors.push("File MIME type is required.");
    return errors;
  }

  const allowed = allowedMimeTypes
    .map((type) => type.toLowerCase());

  if (!allowed.includes(normalizedMimeType)) {
    errors.push(
      `File type "${normalizedMimeType}" is not allowed.`,
    );
  }

  return errors;
}

export function validateFileExtension(
  fileName: string,
  allowedExtensions: readonly string[] = DEFAULT_ALLOWED_EXTENSIONS,
): string[] {
  const errors: string[] = [];
  const extension = getFileExtension(fileName);

  if (!extension) {
    errors.push("File extension is required.");
    return errors;
  }

  const allowed = allowedExtensions.map(normalizeExtension);

  if (!allowed.includes(extension)) {
    errors.push(
      `File extension "${extension}" is not allowed.`,
    );
  }

  return errors;
}

/**
 * Validates that the MIME type and file extension are compatible.
 *
 * This is intentionally a basic consistency check. It does not attempt
 * to inspect binary file signatures.
 */
export function validateMimeTypeAndExtension(
  fileName: string,
  mimeType: string | null | undefined,
): string[] {
  const errors: string[] = [];

  const extension = getFileExtension(fileName);
  const normalizedMimeType = normalizeMimeType(mimeType);

  if (!extension || !normalizedMimeType) {
    return errors;
  }

  const compatibleTypes: Record<string, string[]> = {
    ".pdf": ["application/pdf"],

    ".doc": ["application/msword"],
    ".docx": [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],

    ".xls": ["application/vnd.ms-excel"],
    ".xlsx": [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],

    ".csv": ["text/csv", "application/csv"],
    ".txt": ["text/plain"],

    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
    ".png": ["image/png"],
    ".webp": ["image/webp"],

    ".zip": ["application/zip"],
  };

  const expectedTypes = compatibleTypes[extension];

  if (
    expectedTypes &&
    !expectedTypes.includes(normalizedMimeType)
  ) {
    errors.push(
      `File extension "${extension}" does not match MIME type "${normalizedMimeType}".`,
    );
  }

  return errors;
}

export function validateFile(
  file: {
    name: string;
    size: number;
    type?: string | null;
  },
  options: FileValidationOptions = {},
): FileValidationResult {
  const maxSizeBytes =
    options.maxSizeBytes ?? DEFAULT_MAX_FILE_SIZE;

  const allowedMimeTypes =
    options.allowedMimeTypes ??
    DEFAULT_ALLOWED_MIME_TYPES;

  const allowedExtensions =
    options.allowedExtensions ??
    DEFAULT_ALLOWED_EXTENSIONS;

  const errors: string[] = [
    ...validateFileName(file.name),
    ...validateFileSize(file.size, maxSizeBytes),
    ...validateMimeType(file.type, allowedMimeTypes),
    ...validateFileExtension(
      file.name,
      allowedExtensions,
    ),
    ...validateMimeTypeAndExtension(
      file.name,
      file.type,
    ),
  ];

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
  };
}

export function assertValidFile(
  file: {
    name: string;
    size: number;
    type?: string | null;
  },
  options: FileValidationOptions = {},
): void {
  const result = validateFile(file, options);

  if (!result.valid) {
    throw new Error(
      `File validation failed: ${result.errors.join(" ")}`,
    );
  }
}

export function isAllowedMimeType(
  mimeType: string | null | undefined,
  allowedMimeTypes: readonly string[] = DEFAULT_ALLOWED_MIME_TYPES,
): boolean {
  return (
    validateMimeType(
      mimeType,
      allowedMimeTypes,
    ).length === 0
  );
}

export function isAllowedFileExtension(
  fileName: string,
  allowedExtensions: readonly string[] = DEFAULT_ALLOWED_EXTENSIONS,
): boolean {
  return (
    validateFileExtension(
      fileName,
      allowedExtensions,
    ).length === 0
  );
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = -1;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}