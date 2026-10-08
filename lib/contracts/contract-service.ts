import { ContractStatus, Prisma } from "@prisma/client";
import {
  activateContract,
  completeContract,
  countContracts,
  createContract as createContractRepository,
  deleteContract,
  findContractByAwardId,
  findContractById,
  findContractByNumber,
  findContractWithDetails,
  listContracts,
  terminateContract,
  updateContract,
  updateContractStatus,
} from "@/lib/db/repositories/contract.repository";

export interface CreateContractInput {
  awardId: string;
  vendorId: string;
  organizationId?: string | null;
  solicitationId?: string;
  contractNumber: string;
  title: string;
  description?: string | null;
  status?: ContractStatus;
  contractValue: number | string | Prisma.Decimal;
  startDate?: Date | null;
  endDate?: Date | null;
  signedAt?: Date | null;
}

export interface UpdateContractInput {
  awardId?: string;
  vendorId?: string;
  organizationId?: string | null;
  solicitationId?: string;
  contractNumber?: string;
  title?: string;
  description?: string | null;
  status?: ContractStatus;
  contractValue?: number | string | Prisma.Decimal;
  startDate?: Date | null;
  endDate?: Date | null;
  signedAt?: Date | null;
  completedAt?: Date | null;
  terminatedAt?: Date | null;
  terminationReason?: string | null;
}

export interface ListContractsInput {
  organizationId?: string;
  vendorId?: string;
  awardId?: string;
  solicitationId?: string;
  status?: ContractStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

function normalizeRequiredString(
  value: string | undefined,
  fieldName: string,
): string {
  if (value === undefined || value === null || value.trim() === "") {
    throw new Error(`${fieldName} is required`);
  }

  return value.trim();
}

function normalizeOptionalString(
  value: string | null | undefined,
): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
}

function normalizeDecimal(
  value: number | string | Prisma.Decimal,
  fieldName: string,
): Prisma.Decimal {
  const decimal = new Prisma.Decimal(value);

  if (decimal.isNegative()) {
    throw new Error(`${fieldName} cannot be negative`);
  }

  return decimal;
}

function normalizeOptionalDate(
  value: Date | null | undefined,
): Date | undefined {
  return value ?? undefined;
}

export async function getContractById(id: string) {
  const contractId = normalizeRequiredString(id, "Contract ID");

  return findContractById(contractId);
}

export async function getContractWithDetails(id: string) {
  const contractId = normalizeRequiredString(id, "Contract ID");

  return findContractWithDetails(contractId);
}

export async function getContractByNumber(contractNumber: string) {
  const number = normalizeRequiredString(
    contractNumber,
    "Contract number",
  );

  return findContractByNumber(number);
}

export async function getContractByAwardId(awardId: string) {
  const id = normalizeRequiredString(awardId, "Award ID");

  return findContractByAwardId(id);
}

export async function createContract(input: CreateContractInput) {
  const awardId = normalizeRequiredString(input.awardId, "Award ID");
  const vendorId = normalizeRequiredString(input.vendorId, "Vendor ID");

  const contractNumber = normalizeRequiredString(
    input.contractNumber,
    "Contract number",
  );

  const title = normalizeRequiredString(
    input.title,
    "Contract title",
  );

  const existing = await findContractByNumber(contractNumber);

  if (existing) {
    throw new Error(
      `A contract with number "${contractNumber}" already exists`,
    );
  }

  const data: Prisma.ContractCreateInput = {
    award: {
      connect: {
        id: awardId,
      },
    },

    vendor: {
      connect: {
        id: vendorId,
      },
    },

    organization: input.organizationId
      ? {
          connect: {
            id: input.organizationId,
          },
        }
      : undefined,

    contractNumber,
    title,

    description: normalizeOptionalString(input.description),

    status: input.status ?? ContractStatus.DRAFT,

    contractValue: normalizeDecimal(
      input.contractValue,
      "Contract value",
    ),

    startDate: normalizeOptionalDate(input.startDate),
    endDate: normalizeOptionalDate(input.endDate),
    signedAt: normalizeOptionalDate(input.signedAt),
  };

  return createContractRepository(data);
}

export async function editContract(
  id: string,
  input: UpdateContractInput,
) {
  const contractId = normalizeRequiredString(id, "Contract ID");

  const existing = await findContractById(contractId);

  if (!existing) {
    throw new Error("Contract not found");
  }

  if (
    input.contractNumber !== undefined &&
    input.contractNumber.trim() !== existing.contractNumber
  ) {
    const duplicate = await findContractByNumber(
      input.contractNumber.trim(),
    );

    if (duplicate && duplicate.id !== contractId) {
      throw new Error(
        `A contract with number "${input.contractNumber.trim()}" already exists`,
      );
    }
  }

  const data: Prisma.ContractUpdateInput = {
    ...(input.awardId !== undefined
      ? {
          award: {
            connect: {
              id: normalizeRequiredString(
                input.awardId,
                "Award ID",
              ),
            },
          },
        }
      : {}),

    ...(input.vendorId !== undefined
      ? {
          vendor: {
            connect: {
              id: normalizeRequiredString(
                input.vendorId,
                "Vendor ID",
              ),
            },
          },
        }
      : {}),

    ...(input.organizationId !== undefined
      ? input.organizationId === null
        ? {
            organization: {
              disconnect: true,
            },
          }
        : {
            organization: {
              connect: {
                id: normalizeRequiredString(
                  input.organizationId,
                  "Organization ID",
                ),
              },
            },
          }
      : {}),

    ...(input.contractNumber !== undefined
      ? {
          contractNumber: normalizeRequiredString(
            input.contractNumber,
            "Contract number",
          ),
        }
      : {}),

    ...(input.title !== undefined
      ? {
          title: normalizeRequiredString(
            input.title,
            "Contract title",
          ),
        }
      : {}),

    ...(input.description !== undefined
      ? {
          description: normalizeOptionalString(input.description),
        }
      : {}),

    ...(input.status !== undefined
      ? {
          status: input.status,
        }
      : {}),

    ...(input.contractValue !== undefined
      ? {
          contractValue: normalizeDecimal(
            input.contractValue,
            "Contract value",
          ),
        }
      : {}),

    ...(input.startDate !== undefined
      ? {
          startDate: normalizeOptionalDate(input.startDate),
        }
      : {}),

    ...(input.endDate !== undefined
      ? {
          endDate: normalizeOptionalDate(input.endDate),
        }
      : {}),

    ...(input.signedAt !== undefined
      ? {
          signedAt: normalizeOptionalDate(input.signedAt),
        }
      : {}),

    ...(input.completedAt !== undefined
      ? {
          completedAt: normalizeOptionalDate(input.completedAt),
        }
      : {}),

    ...(input.terminatedAt !== undefined
      ? {
          terminatedAt: normalizeOptionalDate(input.terminatedAt),
        }
      : {}),

    ...(input.terminationReason !== undefined
      ? {
          terminationReason: normalizeOptionalString(
            input.terminationReason,
          ),
        }
      : {}),
  };

  return updateContract(contractId, data);
}

export async function changeContractStatus(
  id: string,
  status: ContractStatus,
) {
  const contractId = normalizeRequiredString(id, "Contract ID");

  return updateContractStatus(contractId, status);
}

export async function activateContractById(id: string) {
  const contractId = normalizeRequiredString(id, "Contract ID");

  return activateContract(contractId);
}

export async function completeContractById(id: string) {
  const contractId = normalizeRequiredString(id, "Contract ID");

  return completeContract(contractId);
}

export async function terminateContractById(
  id: string,
  terminationReason?: string | null,
) {
  const contractId = normalizeRequiredString(id, "Contract ID");

  const contract = await findContractById(contractId);

  if (!contract) {
    throw new Error("Contract not found");
  }

  return updateContract(contractId, {
    status: ContractStatus.TERMINATED,
    terminatedAt: new Date(),
    terminationReason: normalizeOptionalString(terminationReason),
  });
}

export async function removeContract(id: string) {
  const contractId = normalizeRequiredString(id, "Contract ID");

  const contract = await findContractById(contractId);

  if (!contract) {
    throw new Error("Contract not found");
  }

  if (
    contract.status === ContractStatus.ACTIVE ||
    contract.status === ContractStatus.ON_HOLD
  ) {
    throw new Error(
      "Active or on-hold contracts cannot be deleted",
    );
  }

  return deleteContract(contractId);
}

export async function getContracts(
  input: ListContractsInput = {},
) {
  const page = Math.max(1, input.page ?? 1);

  const pageSize = Math.min(
    100,
    Math.max(1, input.pageSize ?? 20),
  );

  const skip = (page - 1) * pageSize;

  return listContracts({
    organizationId: input.organizationId,
    vendorId: input.vendorId,
    awardId: input.awardId,
    solicitationId: input.solicitationId,
    status: input.status,
    search: input.search,
    skip,
    take: pageSize,
  });
}

export async function getContractCount(
  input: Omit<ListContractsInput, "page" | "pageSize"> = {},
) {
  return countContracts({
    organizationId: input.organizationId,
    vendorId: input.vendorId,
    awardId: input.awardId,
    solicitationId: input.solicitationId,
    status: input.status,
    search: input.search,
  });
}