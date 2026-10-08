import { ProcurementMethod, ProcurementStatus } from "@prisma/client";

import {
  createProcurement,
  deleteProcurement,
  findProcurementById,
  findProcurementByReferenceNumber,
  listProcurements,
  updateProcurement,
  updateProcurementStatus,
} from "@/lib/db/repositories/procurement.repository";

export interface CreateProcurementInput {
  organizationId: string;
  departmentId?: string | null;
  countryId: string;
  currencyId: string;
  title: string;
  description?: string | null;
  referenceNumber: string;
  status?: ProcurementStatus;
  procurementMethod?: ProcurementMethod;
  estimatedValue?: number | null;
  plannedStartDate?: Date | null;
  plannedEndDate?: Date | null;
}

export interface UpdateProcurementInput {
  departmentId?: string | null;
  countryId?: string;
  currencyId?: string;
  title?: string;
  description?: string | null;
  referenceNumber?: string;
  status?: ProcurementStatus;
  procurementMethod?: ProcurementMethod;
  estimatedValue?: number | null;
  plannedStartDate?: Date | null;
  plannedEndDate?: Date | null;
}

export interface ListProcurementsInput {
  organizationId?: string;
  departmentId?: string;
  countryId?: string;
  status?: ProcurementStatus;
  procurementMethod?: ProcurementMethod;
  search?: string;
  page?: number;
  pageSize?: number;
}

function normalizeOptionalString(value?: string | null) {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequiredString(value: string) {
  return value.trim();
}

function normalizeEstimatedValue(value?: number | null) {
  if (value === undefined || value === null) {
    return value;
  }

  return Number(value);
}

function normalizeDate(value?: Date | null) {
  if (value === undefined || value === null) {
    return value;
  }

  return value instanceof Date ? value : new Date(value);
}

export async function getProcurementById(id: string) {
  return findProcurementById(id);
}

export async function getProcurementByReferenceNumber(
  referenceNumber: string,
) {
  return findProcurementByReferenceNumber(
    normalizeRequiredString(referenceNumber),
  );
}

export async function createNewProcurement(
  input: CreateProcurementInput,
) {
  const referenceNumber = normalizeRequiredString(
    input.referenceNumber,
  );

  const existingProcurement =
    await findProcurementByReferenceNumber(referenceNumber);

  if (existingProcurement) {
    throw new Error(
      "A procurement with this reference number already exists.",
    );
  }

  return createProcurement({
    organization: {
      connect: {
        id: input.organizationId,
      },
    },

    department:
      input.departmentId
        ? {
            connect: {
              id: input.departmentId,
            },
          }
        : undefined,

    country: {
      connect: {
        id: input.countryId,
      },
    },

    currency: {
      connect: {
        id: input.currencyId,
      },
    },

    title: normalizeRequiredString(input.title),
    description: normalizeOptionalString(input.description),
    referenceNumber,

    status: input.status ?? ProcurementStatus.DRAFT,

    procurementMethod:
      input.procurementMethod ?? ProcurementMethod.OPEN,

    estimatedValue: normalizeEstimatedValue(
      input.estimatedValue,
    ),

    plannedStartDate: normalizeDate(input.plannedStartDate),

    plannedEndDate: normalizeDate(input.plannedEndDate),
  });
}

export async function editProcurement(
  id: string,
  input: UpdateProcurementInput,
) {
  const existingProcurement = await findProcurementById(id);

  if (!existingProcurement) {
    throw new Error("Procurement not found.");
  }

  if (input.referenceNumber !== undefined) {
    const referenceNumber = normalizeRequiredString(
      input.referenceNumber,
    );

    const existingByReference =
      await findProcurementByReferenceNumber(referenceNumber);

    if (
      existingByReference &&
      existingByReference.id !== id
    ) {
      throw new Error(
        "A procurement with this reference number already exists.",
      );
    }
  }

  return updateProcurement(id, {
    department:
      input.departmentId !== undefined
        ? input.departmentId
          ? {
              connect: {
                id: input.departmentId,
              },
            }
          : {
              disconnect: true,
            }
        : undefined,

    country:
      input.countryId !== undefined
        ? {
            connect: {
              id: input.countryId,
            },
          }
        : undefined,

    currency:
      input.currencyId !== undefined
        ? {
            connect: {
              id: input.currencyId,
            },
          }
        : undefined,

    title:
      input.title !== undefined
        ? normalizeRequiredString(input.title)
        : undefined,

    description:
      input.description !== undefined
        ? normalizeOptionalString(input.description)
        : undefined,

    referenceNumber:
      input.referenceNumber !== undefined
        ? normalizeRequiredString(input.referenceNumber)
        : undefined,

    status: input.status,

    procurementMethod: input.procurementMethod,

    estimatedValue:
      input.estimatedValue !== undefined
        ? normalizeEstimatedValue(input.estimatedValue)
        : undefined,

    plannedStartDate:
      input.plannedStartDate !== undefined
        ? normalizeDate(input.plannedStartDate)
        : undefined,

    plannedEndDate:
      input.plannedEndDate !== undefined
        ? normalizeDate(input.plannedEndDate)
        : undefined,
  });
}

export async function changeProcurementStatus(
  id: string,
  status: ProcurementStatus,
) {
  const existingProcurement = await findProcurementById(id);

  if (!existingProcurement) {
    throw new Error("Procurement not found.");
  }

  return updateProcurementStatus(id, status);
}

export async function removeProcurement(id: string) {
  const existingProcurement = await findProcurementById(id);

  if (!existingProcurement) {
    throw new Error("Procurement not found.");
  }

  return deleteProcurement(id);
}

export async function getProcurements(
  input: ListProcurementsInput = {},
) {
  const page = Math.max(1, input.page ?? 1);

  const pageSize = Math.min(
    100,
    Math.max(1, input.pageSize ?? 20),
  );

  const skip = (page - 1) * pageSize;

  return listProcurements({
    organizationId: input.organizationId,
    departmentId: input.departmentId,
    countryId: input.countryId,
    status: input.status,
    procurementMethod: input.procurementMethod,
    search: input.search?.trim() || undefined,
    skip,
    take: pageSize,
  });
}