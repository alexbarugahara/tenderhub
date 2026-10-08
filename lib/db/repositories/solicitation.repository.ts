import { prisma } from "@/lib/db/prisma";
import { SolicitationStatus } from "@prisma/client";
import type {
  Prisma,
  ProcurementMethod,
  SolicitationType,
} from "@prisma/client";

export async function findSolicitationById(id: string) {
  return prisma.solicitation.findUnique({
    where: { id },
  });
}

export async function findSolicitationByNumber(
  solicitationNumber: string
) {
  return prisma.solicitation.findUnique({
    where: { solicitationNumber },
  });
}

export async function findSolicitationWithDetails(id: string) {
  return prisma.solicitation.findUnique({
    where: { id },
    include: {
      procurement: {
        include: {
          department: true,
          country: true,
          currency: true,
        },
      },
      organization: true,
      currency: true,
      lots: {
        orderBy: {
          number: "asc",
        },
        include: {
          requirements: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
      requirements: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      documents: true,
      classifications: {
        include: {
          classification: true,
        },
      },
      evaluationCriteria: {
        orderBy: {
          sortOrder: "asc",
        },
      },
      bids: {
        include: {
          vendor: true,
          lot: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      awards: {
        include: {
          vendor: true,
          lot: true,
          bid: true,
        },
      },
      notices: {
        orderBy: {
          createdAt: "desc",
        },
      },
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

export async function createSolicitation(
  data: Prisma.SolicitationCreateInput
) {
  return prisma.solicitation.create({
    data,
  });
}

export async function updateSolicitation(
  id: string,
  data: Prisma.SolicitationUpdateInput
) {
  return prisma.solicitation.update({
    where: { id },
    data,
  });
}

export async function updateSolicitationStatus(
  id: string,
  status: SolicitationStatus
) {
  return prisma.solicitation.update({
    where: { id },
    data: { status },
  });
}

export async function deleteSolicitation(id: string) {
  return prisma.solicitation.delete({
    where: { id },
  });
}

export async function listSolicitations(params?: {
  organizationId?: string;
  procurementId?: string;
  status?: SolicitationStatus;
  type?: SolicitationType;
  procurementMethod?: ProcurementMethod;
  currencyId?: string;
  search?: string;
  publishedOnly?: boolean;
  skip?: number;
  take?: number;
}) {
  const {
    organizationId,
    procurementId,
    status,
    type,
    procurementMethod,
    currencyId,
    search,
    publishedOnly,
    skip = 0,
    take = 50,
  } = params ?? {};

  const where: Prisma.SolicitationWhereInput = {
    ...(organizationId ? { organizationId } : {}),
    ...(procurementId ? { procurementId } : {}),
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(procurementMethod ? { procurementMethod } : {}),
    ...(currencyId ? { currencyId } : {}),
    ...(publishedOnly
      ? {
          publishedAt: {
            not: null,
          },
        }
      : {}),
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
              solicitationNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.solicitation.findMany({
    where,
    include: {
      organization: true,
      procurement: true,
      currency: true,
      classifications: {
        include: {
          classification: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

export async function countSolicitations(params?: {
  organizationId?: string;
  procurementId?: string;
  status?: SolicitationStatus;
  type?: SolicitationType;
  procurementMethod?: ProcurementMethod;
  currencyId?: string;
  search?: string;
  publishedOnly?: boolean;
}) {
  const {
    organizationId,
    procurementId,
    status,
    type,
    procurementMethod,
    currencyId,
    search,
    publishedOnly,
  } = params ?? {};

  const where: Prisma.SolicitationWhereInput = {
    ...(organizationId ? { organizationId } : {}),
    ...(procurementId ? { procurementId } : {}),
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(procurementMethod ? { procurementMethod } : {}),
    ...(currencyId ? { currencyId } : {}),
    ...(publishedOnly
      ? {
          publishedAt: {
            not: null,
          },
        }
      : {}),
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
              solicitationNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.solicitation.count({
    where,
  });
}

export async function publishSolicitation(id: string) {
  return prisma.solicitation.update({
    where: { id },
    data: {
      status: SolicitationStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });
}

export async function addSolicitationRequirement(
  data: Prisma.RequirementCreateInput
) {
  return prisma.requirement.create({
    data,
  });
}

export async function updateSolicitationRequirement(
  id: string,
  data: Prisma.RequirementUpdateInput
) {
  return prisma.requirement.update({
    where: { id },
    data,
  });
}

export async function removeSolicitationRequirement(id: string) {
  return prisma.requirement.delete({
    where: { id },
  });
}

export async function addSolicitationDocument(
  data: Prisma.SolicitationDocumentCreateInput
) {
  return prisma.solicitationDocument.create({
    data,
  });
}

export async function updateSolicitationDocument(
  id: string,
  data: Prisma.SolicitationDocumentUpdateInput
) {
  return prisma.solicitationDocument.update({
    where: { id },
    data,
  });
}

export async function removeSolicitationDocument(id: string) {
  return prisma.solicitationDocument.delete({
    where: { id },
  });
}

export async function addSolicitationClassification(
  data: Prisma.SolicitationClassificationCreateInput
) {
  return prisma.solicitationClassification.create({
    data,
  });
}

export async function removeSolicitationClassification(id: string) {
  return prisma.solicitationClassification.delete({
    where: { id },
  });
}

export async function addEvaluationCriterion(
  data: Prisma.EvaluationCriterionCreateInput
) {
  return prisma.evaluationCriterion.create({
    data,
  });
}

export async function updateEvaluationCriterion(
  id: string,
  data: Prisma.EvaluationCriterionUpdateInput
) {
  return prisma.evaluationCriterion.update({
    where: { id },
    data,
  });
}

export async function removeEvaluationCriterion(id: string) {
  return prisma.evaluationCriterion.delete({
    where: { id },
  });
}

export async function addSolicitationNotice(
  data: Prisma.NoticeCreateInput
) {
  return prisma.notice.create({
    data,
  });
}

export async function addSolicitationActivity(
  data: Prisma.SolicitationActivityCreateInput
) {
  return prisma.solicitationActivity.create({
    data,
  });
}

export async function listSolicitationActivities(
  solicitationId: string
) {
  return prisma.solicitationActivity.findMany({
    where: {
      solicitationId,
    },
    include: {
      performedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function saveSolicitation(
  vendorId: string,
  solicitationId: string
) {
  return prisma.savedSolicitation.create({
    data: {
      vendor: {
        connect: {
          id: vendorId,
        },
      },
      solicitation: {
        connect: {
          id: solicitationId,
        },
      },
    },
  });
}

export async function unsaveSolicitation(
  vendorId: string,
  solicitationId: string
) {
  return prisma.savedSolicitation.delete({
    where: {
      vendorId_solicitationId: {
        vendorId,
        solicitationId,
      },
    },
  });
}

export async function findSavedSolicitation(
  vendorId: string,
  solicitationId: string
) {
  return prisma.savedSolicitation.findUnique({
    where: {
      vendorId_solicitationId: {
        vendorId,
        solicitationId,
      },
    },
  });
}