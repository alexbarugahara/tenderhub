/**
 * Generic stored-file service.
 *
 * The current TenderHub schema does not contain a generic Document model.
 * Documents are owned by their respective domains, such as:
 * - VendorDocument
 * - SolicitationDocument
 * - BidDocument
 * - ContractDocument
 *
 * This module is retained only for compatibility with older code.
 * No generic document persistence should be added here.
 */

export type CreateStoredFileInput = {
  userId: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string | null;
  size?: number | null;
};

export type UpdateStoredFileInput = {
  fileName?: string;
  fileUrl?: string;
  mimeType?: string | null;
  size?: number | null;
};

export type ListStoredFilesInput = {
  userId?: string;
  page?: number;
  pageSize?: number;
};

function unsupportedOperation(): never {
  throw new Error(
    "Generic stored-file operations are not supported. Use the document service for the relevant domain.",
  );
}

export async function getStoredFileById(_id: string) {
  return unsupportedOperation();
}

export async function createStoredFile(
  _input: CreateStoredFileInput,
) {
  return unsupportedOperation();
}

export async function updateStoredFile(
  _id: string,
  _input: UpdateStoredFileInput,
) {
  return unsupportedOperation();
}

export async function getStoredFiles(
  _input: ListStoredFilesInput = {},
) {
  return unsupportedOperation();
}

export async function getUserStoredFiles(
  _userId: string,
  _options?: Omit<ListStoredFilesInput, "userId">,
) {
  return unsupportedOperation();
}

export async function storedFileExists(_id: string) {
  return unsupportedOperation();
}

export async function deleteStoredFile(_id: string) {
  return unsupportedOperation();
}