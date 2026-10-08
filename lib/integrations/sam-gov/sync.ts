import {
  IntegrationSyncStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import {
  samGovClient,
  type SamGovSearchParams,
  type SamGovSearchResult,
} from "./client";

import {
  mapSamGovNotices,
  type MappedSamGovSolicitation,
} from "./mapper";

export interface SamGovSyncInput {
  integrationId: string;
  search?: SamGovSearchParams;
  dryRun?: boolean;
}

export interface SamGovSyncResult {
  integrationId: string;
  status: IntegrationSyncStatus;
  totalRecords: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  solicitations: MappedSamGovSolicitation[];
  errors: string[];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function validateSyncInput(
  input: SamGovSyncInput,
): void {
  if (!input.integrationId?.trim()) {
    throw new Error("Integration ID is required.");
  }
}

async function createSyncLog(
  integrationId: string,
) {
  return prisma.integrationSyncLog.create({
    data: {
      integrationId,
      status: IntegrationSyncStatus.RUNNING,
      startedAt: new Date(),
    },
  });
}

async function completeSyncLog(
  syncLogId: string,
  status: IntegrationSyncStatus,
  recordsProcessed: number,
  errorMessage?: string,
) {
  return prisma.integrationSyncLog.update({
    where: {
      id: syncLogId,
    },
    data: {
      status,
      completedAt: new Date(),
      recordsProcessed,
      ...(errorMessage
        ? { errorMessage }
        : {}),
    },
  });
}

async function updateIntegrationAfterSync(
  integrationId: string,
  status: IntegrationSyncStatus,
  errorMessage?: string,
) {
  await prisma.integration.update({
    where: {
      id: integrationId,
    },
    data: {
      lastSyncAt: new Date(),
      ...(status === IntegrationSyncStatus.FAILED
        ? {
            lastError: errorMessage ?? "Synchronization failed.",
          }
        : {
            lastError: null,
          }),
    },
  });
}

export async function syncSamGov(
  input: SamGovSyncInput,
): Promise<SamGovSyncResult> {
  validateSyncInput(input);

  const integrationId = input.integrationId.trim();

  const integration = await prisma.integration.findUnique({
    where: {
      id: integrationId,
    },
  });

  if (!integration) {
    throw new Error(
      `Integration "${integrationId}" was not found.`,
    );
  }

  const syncLog = await createSyncLog(integrationId);

  try {
    const result = await samGovClient.search(
      input.search ?? {},
    );

    const mapped = mapSamGovNotices(
      result.notices,
    );

    const processed = result.notices.length;
    const successful = mapped.length;
    const failed = Math.max(
      processed - successful,
      0,
    );

    await completeSyncLog(
      syncLog.id,
      IntegrationSyncStatus.SUCCESS,
      processed,
    );

    await updateIntegrationAfterSync(
      integrationId,
      IntegrationSyncStatus.SUCCESS,
    );

    return {
      integrationId,
      status: IntegrationSyncStatus.SUCCESS,
      totalRecords: result.totalRecords,
      processed,
      successful,
      failed,
      skipped: 0,
      solicitations: mapped,
      errors: [],
    };
  } catch (error) {
    const message = getErrorMessage(error);

    await completeSyncLog(
      syncLog.id,
      IntegrationSyncStatus.FAILED,
      0,
      message,
    );

    await updateIntegrationAfterSync(
      integrationId,
      IntegrationSyncStatus.FAILED,
      message,
    );

    return {
      integrationId,
      status: IntegrationSyncStatus.FAILED,
      totalRecords: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      solicitations: [],
      errors: [message],
    };
  }
}

export async function previewSamGovSync(
  input: SamGovSyncInput,
): Promise<SamGovSyncResult> {
  return syncSamGov({
    ...input,
    dryRun: true,
  });
}

export async function searchAndMapSamGov(
  search: SamGovSearchParams = {},
): Promise<MappedSamGovSolicitation[]> {
  const result = await samGovClient.search(
    search,
  );

  return mapSamGovNotices(
    result.notices,
  );
}

export async function getSamGovSyncPreview(
  search: SamGovSearchParams = {},
): Promise<SamGovSearchResult> {
  return samGovClient.search(search);
}

export async function testSamGovConnection(): Promise<{
  connected: boolean;
  totalRecords: number;
  error?: string;
}> {
  try {
    const result = await samGovClient.search({
      limit: 1,
    });

    return {
      connected: true,
      totalRecords: result.totalRecords,
    };
  } catch (error) {
    return {
      connected: false,
      totalRecords: 0,
      error: getErrorMessage(error),
    };
  }
}