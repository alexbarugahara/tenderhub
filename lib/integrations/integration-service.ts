import {
  IntegrationStatus,
  IntegrationType,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export interface CreateIntegrationInput {
  organizationId: string;
  type: IntegrationType;
  name: string;
  provider: string;
  status?: IntegrationStatus;
  configuration?: Record<string, unknown>;
}

export interface UpdateIntegrationInput {
  type?: IntegrationType;
  name?: string;
  provider?: string;
  status?: IntegrationStatus;
  configuration?: Record<string, unknown>;
}

export interface ListIntegrationsInput {
  organizationId?: string;
  type?: IntegrationType;
  status?: IntegrationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

function normalizeText(value?: string): string | undefined {
  if (value === undefined) return undefined;

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function normalizeCreateInput(
  input: CreateIntegrationInput,
): CreateIntegrationInput {
  const organizationId = input.organizationId.trim();
  const name = input.name.trim();
  const provider = input.provider.trim();

  if (!organizationId) {
    throw new Error("Organization ID is required.");
  }

  if (!name) {
    throw new Error("Integration name is required.");
  }

  if (!provider) {
    throw new Error("Integration provider is required.");
  }

  return {
    organizationId,
    type: input.type,
    name,
    provider,
    status: input.status,
    configuration: input.configuration,
  };
}

function normalizeUpdateInput(
  input: UpdateIntegrationInput,
): UpdateIntegrationInput {
  return {
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.name !== undefined
      ? { name: input.name.trim() }
      : {}),
    ...(input.provider !== undefined
      ? { provider: input.provider.trim() }
      : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.configuration !== undefined
      ? { configuration: input.configuration }
      : {}),
  };
}

function toJsonValue(
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value as Prisma.InputJsonValue;
}

export async function getIntegrationById(id: string) {
  return prisma.integration.findUnique({
    where: { id },
    include: {
      syncLogs: {
        orderBy: {
          startedAt: "desc",
        },
        take: 10,
      },
    },
  });
}

export async function createNewIntegration(
  input: CreateIntegrationInput,
) {
  const data = normalizeCreateInput(input);

  return prisma.integration.create({
    data: {
      organizationId: data.organizationId,
      type: data.type,
      name: data.name,
      provider: data.provider,
      status: data.status ?? IntegrationStatus.INACTIVE,
      ...(data.configuration !== undefined
        ? { configuration: toJsonValue(data.configuration) }
        : {}),
    },
  });
}

export async function editIntegration(
  id: string,
  input: UpdateIntegrationInput,
) {
  const data = normalizeUpdateInput(input);

  return prisma.integration.update({
    where: { id },
    data: {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.provider !== undefined
        ? { provider: data.provider }
        : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.configuration !== undefined
        ? { configuration: toJsonValue(data.configuration) }
        : {}),
    },
  });
}

export async function changeIntegrationStatus(
  id: string,
  status: IntegrationStatus,
) {
  return prisma.integration.update({
    where: { id },
    data: { status },
  });
}

export async function removeIntegration(id: string) {
  return prisma.integration.delete({
    where: { id },
  });
}

export async function getIntegrations(
  input: ListIntegrationsInput = {},
) {
  const page = Math.max(input.page ?? 1, 1);
  const pageSize = Math.min(
    Math.max(input.pageSize ?? 20, 1),
    100,
  );

  const search = normalizeText(input.search);

  const where: Prisma.IntegrationWhereInput = {
    ...(input.organizationId
      ? { organizationId: input.organizationId }
      : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              provider: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.integration.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.integration.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function activateIntegration(id: string) {
  return changeIntegrationStatus(
    id,
    IntegrationStatus.ACTIVE,
  );
}

export async function deactivateIntegration(id: string) {
  return changeIntegrationStatus(
    id,
    IntegrationStatus.INACTIVE,
  );
}

export async function suspendIntegration(id: string) {
  return changeIntegrationStatus(
    id,
    IntegrationStatus.SUSPENDED,
  );
}

export async function markIntegrationError(id: string) {
  return changeIntegrationStatus(
    id,
    IntegrationStatus.ERROR,
  );
}

export async function isIntegrationActive(
  id: string,
): Promise<boolean> {
  const integration = await prisma.integration.findUnique({
    where: { id },
    select: {
      status: true,
    },
  });

  return integration?.status === IntegrationStatus.ACTIVE;
}

export async function getOrganizationIntegrations(
  organizationId: string,
  page?: number,
  pageSize?: number,
) {
  return getIntegrations({
    organizationId: organizationId.trim(),
    page,
    pageSize,
  });
}

export async function getActiveIntegrations(
  organizationId?: string,
) {
  return getIntegrations({
    organizationId: normalizeText(organizationId),
    status: IntegrationStatus.ACTIVE,
    page: 1,
    pageSize: 100,
  });
}

export async function getIntegrationsByType(
  type: IntegrationType,
  organizationId?: string,
  page?: number,
  pageSize?: number,
) {
  return getIntegrations({
    organizationId: normalizeText(organizationId),
    type,
    page,
    pageSize,
  });
}