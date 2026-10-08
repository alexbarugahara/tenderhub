import { prisma } from "@/lib/db/prisma";
import type { Prisma, ProcurementMethod, ProcurementStatus } from "@prisma/client";

export async function findProcurementById(id: string) {
  return prisma.procurement.findUnique({
    where: { id },
  });
}

export async function findProcurementByReferenceNumber(
  referenceNumber: string
) {
  return prisma.procurement.findUnique({
    where: { referenceNumber },
  });
}

export async function findProcurementWithDetails(id: string) {
  return prisma.procurement.findUnique({
    where: { id },
    include: {
      organization: true,
      department: true,
      country: true,
      currency: true,
      solicitations: true,
      activities: {
        include: {
          performedBy: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function createProcurement(
  data: Prisma.ProcurementCreateInput
) {
  return prisma.procurement.create({
    data,
  });
}

export async function updateProcurement(
  id: string,
  data: Prisma.ProcurementUpdateInput
) {
  return prisma.procurement.update({
    where: { id },
    data,
  });
}

export async function updateProcurementStatus(
  id: string,
  status: ProcurementStatus
) {
  return prisma.procurement.update({
    where: { id },
    data: { status },
  });
}

export async function deleteProcurement(id: string) {
  return prisma.procurement.delete({
    where: { id },
  });
}

export async function listProcurements(params?: {
  organizationId?: string;
  departmentId?: string;
  countryId?: string;
  status?: ProcurementStatus;
  procurementMethod?: ProcurementMethod;
  search?: string;
  skip?: number;
  take?: number;
}) {
  const {
    organizationId,
    departmentId,
    countryId,
    status,
    procurementMethod,
    search,
    skip = 0,
    take = 50,
  } = params ?? {};

  const where: Prisma.ProcurementWhereInput = {
    ...(organizationId ? { organizationId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(countryId ? { countryId } : {}),
    ...(status ? { status } : {}),
    ...(procurementMethod ? { procurementMethod } : {}),
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              referenceNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.procurement.findMany({
    where,
    include: {
      organization: true,
      department: true,
      country: true,
      currency: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

export async function countProcurements(params?: {
  organizationId?: string;
  departmentId?: string;
  countryId?: string;
  status?: ProcurementStatus;
  procurementMethod?: ProcurementMethod;
  search?: string;
}) {
  const {
    organizationId,
    departmentId,
    countryId,
    status,
    procurementMethod,
    search,
  } = params ?? {};

  const where: Prisma.ProcurementWhereInput = {
    ...(organizationId ? { organizationId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(countryId ? { countryId } : {}),
    ...(status ? { status } : {}),
    ...(procurementMethod ? { procurementMethod } : {}),
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              referenceNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.procurement.count({
    where,
  });
}

export async function addProcurementActivity(
  data: Prisma.ProcurementActivityCreateInput
) {
  return prisma.procurementActivity.create({
    data,
  });
}

export async function listProcurementActivities(
  procurementId: string
) {
  return prisma.procurementActivity.findMany({
    where: {
      procurementId,
    },
    include: {
      performedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}