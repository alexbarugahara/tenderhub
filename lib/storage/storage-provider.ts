export type StorageProviderName =
  | "LOCAL"
  | "S3"
  | "CLOUDINARY"
  | "DEMO";

export type StorageUploadInput = {
  file: Buffer | Uint8Array;
  fileName: string;
  contentType?: string | null;
  folder?: string | null;
};

export type StorageUploadResult = {
  key: string;
  url: string;
  fileName: string;
  contentType: string | null;
  size: number;
};

export type StorageDeleteInput = {
  key: string;
};

export interface StorageProvider {
  readonly name: StorageProviderName;

  upload(
    input: StorageUploadInput,
  ): Promise<StorageUploadResult>;

  delete(
    input: StorageDeleteInput,
  ): Promise<void>;

  getUrl(key: string): string;
}

function normalizeFileName(fileName: string): string {
  const normalized = fileName.trim();

  if (!normalized) {
    throw new Error("File name is required.");
  }

  return normalized.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizeFolder(folder?: string | null): string {
  if (!folder) {
    return "";
  }

  return folder
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "_");
}

function createStorageKey(
  fileName: string,
  folder?: string | null,
): string {
  const normalizedFileName = normalizeFileName(fileName);
  const normalizedFolder = normalizeFolder(folder);

  return normalizedFolder
    ? `${normalizedFolder}/${normalizedFileName}`
    : normalizedFileName;
}

/**
 * Development/demo provider.
 *
 * It does not persist the file. It only creates a deterministic
 * storage-style result so application flows can be tested before
 * a production provider is configured.
 */
class DemoStorageProvider implements StorageProvider {
  readonly name = "DEMO" as const;

  async upload(
    input: StorageUploadInput,
  ): Promise<StorageUploadResult> {
    const key = createStorageKey(
      input.fileName,
      input.folder,
    );

    const file = Buffer.from(input.file);

    return {
      key,
      url: this.getUrl(key),
      fileName: normalizeFileName(input.fileName),
      contentType: input.contentType ?? null,
      size: file.length,
    };
  }

  async delete(
    _input: StorageDeleteInput,
  ): Promise<void> {
    return;
  }

  getUrl(key: string): string {
    const normalizedKey = key.replace(/^\/+/, "");

    return `/uploads/${normalizedKey}`;
  }
}

function normalizeProviderName(
  provider?: string | null,
): StorageProviderName {
  const value = provider?.trim().toUpperCase();

  switch (value) {
    case "LOCAL":
      return "LOCAL";

    case "S3":
      return "S3";

    case "CLOUDINARY":
      return "CLOUDINARY";

    case "DEMO":
      return "DEMO";

    default:
      return "DEMO";
  }
}

/**
 * Returns the configured storage provider.
 *
 * The provider abstraction is intentionally kept independent from
 * Prisma and the application domain.
 */
export function getStorageProvider(
  provider?: string | null,
): StorageProvider {
  const providerName = normalizeProviderName(
    provider ?? process.env.STORAGE_PROVIDER,
  );

  switch (providerName) {
    case "DEMO":
      return new DemoStorageProvider();

    case "LOCAL":
      throw new Error(
        "LOCAL storage provider is not configured yet.",
      );

    case "S3":
      throw new Error(
        "S3 storage provider is not configured yet.",
      );

    case "CLOUDINARY":
      throw new Error(
        "Cloudinary storage provider is not configured yet.",
      );

    default:
      throw new Error(
        `Unsupported storage provider: ${providerName}`,
      );
  }
}

/**
 * Returns the currently configured provider name.
 */
export function getConfiguredStorageProvider(): StorageProviderName {
  return normalizeProviderName(
    process.env.STORAGE_PROVIDER,
  );
}

/**
 * Checks whether a storage provider is configured.
 */
export function isStorageProviderConfigured(
  provider?: string | null,
): boolean {
  const providerName = normalizeProviderName(
    provider ?? process.env.STORAGE_PROVIDER,
  );

  if (providerName === "DEMO") {
    return true;
  }

  if (providerName === "LOCAL") {
    return Boolean(process.env.STORAGE_LOCAL_PATH);
  }

  if (providerName === "S3") {
    return Boolean(
      process.env.AWS_S3_BUCKET &&
        process.env.AWS_REGION &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY,
    );
  }

  if (providerName === "CLOUDINARY") {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    );
  }

  return false;
}

/**
 * Returns the providers currently supported by the application.
 */
export function getAvailableStorageProviders(): StorageProviderName[] {
  return ["LOCAL", "S3", "CLOUDINARY", "DEMO"];
}