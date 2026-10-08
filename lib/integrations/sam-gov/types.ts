import {
  IntegrationSyncStatus,
  IntegrationType,
} from "@prisma/client";

import type {
  Integration,
  IntegrationSyncLog,
  IntegrationStatus,
} from "@prisma/client";

/**
 * SAM.gov integration types
 *
 * These types are aligned with the current Prisma schema.
 */

export type SamGovIntegration = Integration;

export type SamGovIntegrationSyncLog = IntegrationSyncLog;

export interface SamGovIntegrationConfig {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  defaultLimit?: number;
  defaultOffset?: number;
}

export interface SamGovSyncOptions {
  integrationId: string;
  dryRun?: boolean;
  limit?: number;
  offset?: number;
  keyword?: string;
  solicitationNumber?: string;
  organizationName?: string;
}

export interface SamGovSyncSummary {
  integrationId: string;
  status: IntegrationSyncStatus;
  totalRecords: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  startedAt?: Date;
  completedAt?: Date;
  errors: string[];
}

export interface SamGovSyncState {
  integrationId: string;
  status: IntegrationSyncStatus;
  lastSyncAt?: Date;
  lastSuccessfulSyncAt?: Date;
  lastFailedSyncAt?: Date;
  lastError?: string;
  recordsProcessed: number;
}

export interface SamGovIntegrationInfo {
  id: string;
  organizationId: string;
  type: IntegrationType;
  name: string;
  provider: string;
  status: IntegrationStatus;
  configuration: SamGovIntegrationConfig;
}

export interface SamGovNoticeReference {
  noticeId?: string;
  solicitationNumber?: string;
  title?: string;
  externalUrl?: string;
}

export interface SamGovSyncError {
  notice?: SamGovNoticeReference;
  message: string;
  code?: string;
}

export interface SamGovSyncResponse {
  summary: SamGovSyncSummary;
  errors: SamGovSyncError[];
}

/**
 * Determines whether an Integration represents a SAM.gov integration.
 */
export function isSamGovIntegration(
  integration: Pick<Integration, "type" | "provider">,
): boolean {
  return (
    integration.type === IntegrationType.GOVERNMENT &&
    integration.provider.toLowerCase().includes("sam.gov")
  );
}

/**
 * Safely parses the JSON configuration stored on Integration.configuration.
 */
export function parseSamGovIntegrationConfig(
  configuration: unknown,
): SamGovIntegrationConfig {
  if (
    !configuration ||
    typeof configuration !== "object" ||
    Array.isArray(configuration)
  ) {
    return {};
  }

  const value = configuration as Record<string, unknown>;

  return {
    apiKey:
      typeof value.apiKey === "string"
        ? value.apiKey
        : undefined,

    baseUrl:
      typeof value.baseUrl === "string"
        ? value.baseUrl
        : undefined,

    timeoutMs:
      typeof value.timeoutMs === "number"
        ? value.timeoutMs
        : undefined,

    defaultLimit:
      typeof value.defaultLimit === "number"
        ? value.defaultLimit
        : undefined,

    defaultOffset:
      typeof value.defaultOffset === "number"
        ? value.defaultOffset
        : undefined,
  };
}

/**
 * Converts a Prisma Integration into the application-level
 * SAM.gov integration information object.
 */
export function createSamGovIntegrationInfo(
  integration: Integration,
): SamGovIntegrationInfo {
  return {
    id: integration.id,
    organizationId: integration.organizationId,
    type: integration.type,
    name: integration.name,
    provider: integration.provider,
    status: integration.status,
    configuration: parseSamGovIntegrationConfig(
      integration.configuration,
    ),
  };
}

/**
 * Checks whether a synchronization completed successfully.
 */
export function isSyncSuccessful(
  status: IntegrationSyncStatus,
): boolean {
  return status === IntegrationSyncStatus.SUCCESS;
}

/**
 * Checks whether a synchronization is currently running.
 */
export function isSyncRunning(
  status: IntegrationSyncStatus,
): boolean {
  return status === IntegrationSyncStatus.RUNNING;
}

/**
 * Checks whether a synchronization failed.
 */
export function isSyncFailed(
  status: IntegrationSyncStatus,
): boolean {
  return status === IntegrationSyncStatus.FAILED;
}

/**
 * Creates the initial state for a new SAM.gov synchronization.
 */
export function createEmptySamGovSyncSummary(
  integrationId: string,
): SamGovSyncSummary {
  return {
    integrationId,
    status: IntegrationSyncStatus.RUNNING,
    totalRecords: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };
}
