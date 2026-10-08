import {
  ProcurementMethod,
  SolicitationStatus,
  SolicitationType,
} from "@prisma/client";

import {
  addEvaluationCriterion,
  addSolicitationActivity,
  addSolicitationClassification,
  addSolicitationDocument,
  addSolicitationNotice,
  addSolicitationRequirement,
  createSolicitation,
  deleteSolicitation,
  findSavedSolicitation,
  findSolicitationById,
  findSolicitationByNumber,
  listSolicitations,
  removeSolicitationClassification,
  removeSolicitationDocument,
  removeSolicitationRequirement,
  saveSolicitation,
  unsaveSolicitation,
  updateEvaluationCriterion,
  updateSolicitation,
  updateSolicitationStatus,
} from "@/lib/db/repositories/solicitation.repository";

import {
  assertValidSolicitationForPublication,
} from "@/lib/solicitations/solicitation-validation";

export interface CreateSolicitationInput {
  procurementId: string;
  organizationId: string;
  currencyId: string;
  solicitationNumber: string;
  title: string;
  description?: string | null;
  status?: SolicitationStatus;
  type: SolicitationType;
  procurementMethod: ProcurementMethod;
  publishedAt?: Date | null;
  openingDate?: Date | null;
  closingDate?: Date | null;
  estimatedValue?: number | null;
  bidSecurityRequired?: boolean;
  bidSecurityAmount?: number | null;
  applicationFeeRequired?: boolean;
  applicationFeeAmount?: number | null;
}

export interface UpdateSolicitationInput {
  procurementId?: string;
  organizationId?: string;
  currencyId?: string;
  solicitationNumber?: string;
  title?: string;
  description?: string | null;
  status?: SolicitationStatus;
  type?: SolicitationType;
  procurementMethod?: ProcurementMethod;
  publishedAt?: Date | null;
  openingDate?: Date | null;
  closingDate?: Date | null;
  estimatedValue?: number | null;
  bidSecurityRequired?: boolean;
  bidSecurityAmount?: number | null;
  applicationFeeRequired?: boolean;
  applicationFeeAmount?: number | null;
}

export interface ListSolicitationsInput {
  organizationId?: string;
  procurementId?: string;
  status?: SolicitationStatus;
  type?: SolicitationType;
  procurementMethod?: ProcurementMethod;
  currencyId?: string;
  search?: string;
  publishedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

function normalizeRequiredString(value: string): string {
  return value.trim();
}

function normalizeOptionalString(
  value?: string | null,
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDate(
  value?: Date | null,
): Date | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  return value instanceof Date ? value : new Date(value);
}

function normalizeAmount(
  value?: number | null,
): number | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  return Number(value);
}

export async function getSolicitationById(id: string) {
  return findSolicitationById(id);
}

export async function getSolicitationByNumber(
  solicitationNumber: string,
) {
  return findSolicitationByNumber(
    normalizeRequiredString(solicitationNumber),
  );
}

export async function createNewSolicitation(
  input: CreateSolicitationInput,
) {
  const solicitationNumber = normalizeRequiredString(
    input.solicitationNumber,
  );

  const existingSolicitation =
    await findSolicitationByNumber(solicitationNumber);

  if (existingSolicitation) {
    throw new Error(
      "A solicitation with this number already exists.",
    );
  }

  const openingDate = normalizeDate(input.openingDate);
  const closingDate = normalizeDate(input.closingDate);

  if (
    openingDate &&
    closingDate &&
    closingDate <= openingDate
  ) {
    throw new Error(
      "The closing date must be after the opening date.",
    );
  }

  if (
    input.publishedAt &&
    openingDate &&
    openingDate < input.publishedAt
  ) {
    throw new Error(
      "The opening date cannot be before the publication date.",
    );
  }

  return createSolicitation({
    procurement: {
      connect: {
        id: input.procurementId,
      },
    },
    organization: {
      connect: {
        id: input.organizationId,
      },
    },
    currency: {
      connect: {
        id: input.currencyId,
      },
    },
    solicitationNumber,
    title: normalizeRequiredString(input.title),
    description:
      normalizeOptionalString(input.description) ?? "",
    status: input.status ?? SolicitationStatus.DRAFT,
    type: input.type,
    procurementMethod: input.procurementMethod,
    publishedAt: normalizeDate(input.publishedAt),
    openingDate,
    closingDate,
    estimatedValue: normalizeAmount(
      input.estimatedValue,
    ),
    bidSecurityRequired:
      input.bidSecurityRequired ?? false,
    bidSecurityAmount: normalizeAmount(
      input.bidSecurityAmount,
    ),
    applicationFeeRequired:
      input.applicationFeeRequired ?? false,
    applicationFeeAmount: normalizeAmount(
      input.applicationFeeAmount,
    ),
  });
}

export async function editSolicitation(
  id: string,
  input: UpdateSolicitationInput,
) {
  const existingSolicitation =
    await findSolicitationById(id);

  if (!existingSolicitation) {
    throw new Error("Solicitation not found.");
  }

  if (input.solicitationNumber !== undefined) {
    const solicitationNumber = normalizeRequiredString(
      input.solicitationNumber,
    );

    const existingByNumber =
      await findSolicitationByNumber(solicitationNumber);

    if (
      existingByNumber &&
      existingByNumber.id !== id
    ) {
      throw new Error(
        "A solicitation with this number already exists.",
      );
    }
  }

  const updateData: Parameters<
    typeof updateSolicitation
  >[1] = {};

  if (input.procurementId !== undefined) {
    updateData.procurement = {
      connect: {
        id: input.procurementId,
      },
    };
  }

  if (input.organizationId !== undefined) {
    updateData.organization = {
      connect: {
        id: input.organizationId,
      },
    };
  }

  if (input.currencyId !== undefined) {
    updateData.currency = {
      connect: {
        id: input.currencyId,
      },
    };
  }

  if (input.solicitationNumber !== undefined) {
    updateData.solicitationNumber =
      normalizeRequiredString(
        input.solicitationNumber,
      );
  }

  if (input.title !== undefined) {
    updateData.title = normalizeRequiredString(
      input.title,
    );
  }

  if (input.description !== undefined) {
    updateData.description =
      normalizeOptionalString(input.description) ?? "";
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  if (input.type !== undefined) {
    updateData.type = input.type;
  }

  if (input.procurementMethod !== undefined) {
    updateData.procurementMethod =
      input.procurementMethod;
  }

  if (input.publishedAt !== undefined) {
    updateData.publishedAt = normalizeDate(
      input.publishedAt,
    );
  }

  if (input.openingDate !== undefined) {
    updateData.openingDate = normalizeDate(
      input.openingDate,
    );
  }

  if (input.closingDate !== undefined) {
    updateData.closingDate = normalizeDate(
      input.closingDate,
    );
  }

  const effectiveOpeningDate =
    input.openingDate !== undefined
      ? normalizeDate(input.openingDate)
      : existingSolicitation.openingDate;

  const effectiveClosingDate =
    input.closingDate !== undefined
      ? normalizeDate(input.closingDate)
      : existingSolicitation.closingDate;

  const effectivePublishedAt =
    input.publishedAt !== undefined
      ? normalizeDate(input.publishedAt)
      : existingSolicitation.publishedAt;

  if (
    effectiveOpeningDate &&
    effectiveClosingDate &&
    effectiveClosingDate <= effectiveOpeningDate
  ) {
    throw new Error(
      "The closing date must be after the opening date.",
    );
  }

  if (
    effectivePublishedAt &&
    effectiveOpeningDate &&
    effectiveOpeningDate < effectivePublishedAt
  ) {
    throw new Error(
      "The opening date cannot be before the publication date.",
    );
  }

  if (input.estimatedValue !== undefined) {
    updateData.estimatedValue = normalizeAmount(
      input.estimatedValue,
    );
  }

  if (input.bidSecurityRequired !== undefined) {
    updateData.bidSecurityRequired =
      input.bidSecurityRequired;
  }

  if (input.bidSecurityAmount !== undefined) {
    updateData.bidSecurityAmount = normalizeAmount(
      input.bidSecurityAmount,
    );
  }

  if (input.applicationFeeRequired !== undefined) {
    updateData.applicationFeeRequired =
      input.applicationFeeRequired;
  }

  if (input.applicationFeeAmount !== undefined) {
    updateData.applicationFeeAmount =
      normalizeAmount(
        input.applicationFeeAmount,
      );
  }

  return updateSolicitation(id, updateData);
}

export async function changeSolicitationStatus(
  id: string,
  status: SolicitationStatus,
) {
  const existingSolicitation =
    await findSolicitationById(id);

  if (!existingSolicitation) {
    throw new Error("Solicitation not found.");
  }

  return updateSolicitationStatus(id, status);
}

export async function publishExistingSolicitation(
  id: string,
) {
  const existingSolicitation =
    await findSolicitationById(id);

  if (!existingSolicitation) {
    throw new Error("Solicitation not found.");
  }

  if (
    existingSolicitation.status !==
    SolicitationStatus.DRAFT
  ) {
    throw new Error(
      "Only draft solicitations can be published.",
    );
  }

  assertValidSolicitationForPublication({
    procurementId:
      existingSolicitation.procurementId,
    organizationId:
      existingSolicitation.organizationId,
    currencyId:
      existingSolicitation.currencyId,
    solicitationNumber:
      existingSolicitation.solicitationNumber,
    title: existingSolicitation.title,
    description:
      existingSolicitation.description,
    status: existingSolicitation.status,
    type: existingSolicitation.type,
    procurementMethod:
      existingSolicitation.procurementMethod,
    publishedAt: null,
    openingDate:
      existingSolicitation.openingDate,
    closingDate:
      existingSolicitation.closingDate,
    estimatedValue:
      existingSolicitation.estimatedValue === null
        ? null
        : Number(existingSolicitation.estimatedValue),
    bidSecurityRequired:
      existingSolicitation.bidSecurityRequired,
    bidSecurityAmount:
      existingSolicitation.bidSecurityAmount === null
        ? null
        : Number(existingSolicitation.bidSecurityAmount),
    applicationFeeRequired:
      existingSolicitation.applicationFeeRequired,
    applicationFeeAmount:
      existingSolicitation.applicationFeeAmount === null
        ? null
        : Number(existingSolicitation.applicationFeeAmount),
  });

  const publishedAt = new Date();

  return updateSolicitation(id, {
    status: SolicitationStatus.PUBLISHED,
    publishedAt,
  });
}

export async function removeSolicitation(id: string) {
  const existingSolicitation =
    await findSolicitationById(id);

  if (!existingSolicitation) {
    throw new Error("Solicitation not found.");
  }

  return deleteSolicitation(id);
}

export async function getSolicitations(
  input: ListSolicitationsInput = {},
) {
  const page = Math.max(1, input.page ?? 1);

  const pageSize = Math.min(
    100,
    Math.max(1, input.pageSize ?? 20),
  );

  const skip = (page - 1) * pageSize;

  return listSolicitations({
    organizationId: input.organizationId,
    procurementId: input.procurementId,
    status: input.status,
    type: input.type,
    procurementMethod: input.procurementMethod,
    currencyId: input.currencyId,
    search: input.search?.trim() || undefined,
    publishedOnly: input.publishedOnly,
    skip,
    take: pageSize,
  });
}

export async function addRequirement(
  solicitationId: string,
  data: Parameters<
    typeof addSolicitationRequirement
  >[0],
) {
  const solicitation =
    await findSolicitationById(solicitationId);

  if (!solicitation) {
    throw new Error("Solicitation not found.");
  }

  return addSolicitationRequirement({
    ...data,
    solicitation: {
      connect: {
        id: solicitationId,
      },
    },
  });
}

export async function editRequirement(
  id: string,
  data: Record<string, unknown>,
) {
  throw new Error(
    "Requirement editing is not available through the solicitation service.",
  );
}

export async function removeRequirement(id: string) {
  return removeSolicitationRequirement(id);
}

export async function addDocument(
  solicitationId: string,
  data: Parameters<
    typeof addSolicitationDocument
  >[0],
) {
  const solicitation =
    await findSolicitationById(solicitationId);

  if (!solicitation) {
    throw new Error("Solicitation not found.");
  }

  return addSolicitationDocument({
    ...data,
    solicitation: {
      connect: {
        id: solicitationId,
      },
    },
  });
}

export async function removeDocument(id: string) {
  return removeSolicitationDocument(id);
}

export async function addClassification(
  solicitationId: string,
  classificationId: string,
) {
  const solicitation =
    await findSolicitationById(solicitationId);

  if (!solicitation) {
    throw new Error("Solicitation not found.");
  }

  return addSolicitationClassification({
    solicitation: {
      connect: {
        id: solicitationId,
      },
    },
    classification: {
      connect: {
        id: classificationId,
      },
    },
  });
}

export async function removeClassification(
  solicitationId: string,
  classificationId: string,
) {
  return removeSolicitationClassification(
    classificationId,
  );
}

export async function addEvaluationCriteria(
  solicitationId: string,
  data: Parameters<typeof addEvaluationCriterion>[0],
) {
  const solicitation =
    await findSolicitationById(solicitationId);

  if (!solicitation) {
    throw new Error("Solicitation not found.");
  }

  return addEvaluationCriterion({
    ...data,
    solicitation: {
      connect: {
        id: solicitationId,
      },
    },
  });
}

export async function editEvaluationCriteria(
  id: string,
  data: Parameters<
    typeof updateEvaluationCriterion
  >[1],
) {
  return updateEvaluationCriterion(id, data);
}

export async function removeEvaluationCriteria(
  id: string,
) {
  return (
    await import(
      "@/lib/db/repositories/solicitation.repository"
    )
  ).removeEvaluationCriterion(id);
}

export async function addNotice(
  solicitationId: string,
  data: Parameters<typeof addSolicitationNotice>[0],
) {
  const solicitation =
    await findSolicitationById(solicitationId);

  if (!solicitation) {
    throw new Error("Solicitation not found.");
  }

  return addSolicitationNotice({
    ...data,
    solicitation: {
      connect: {
        id: solicitationId,
      },
    },
  });
}

export async function recordActivity(
  solicitationId: string,
  data: Parameters<
    typeof addSolicitationActivity
  >[0],
) {
  const solicitation =
    await findSolicitationById(solicitationId);

  if (!solicitation) {
    throw new Error("Solicitation not found.");
  }

  return addSolicitationActivity({
    ...data,
    solicitation: {
      connect: {
        id: solicitationId,
      },
    },
  });
}

export async function saveSolicitationForVendor(
  solicitationId: string,
  vendorId: string,
) {
  const solicitation =
    await findSolicitationById(solicitationId);

  if (!solicitation) {
    throw new Error("Solicitation not found.");
  }

  return saveSolicitation(
    vendorId,
    solicitationId,
  );
}

export async function unsaveSolicitationForVendor(
  solicitationId: string,
  vendorId: string,
) {
  return unsaveSolicitation(
    vendorId,
    solicitationId,
  );
}

export async function getSavedSolicitation(
  solicitationId: string,
  vendorId: string,
) {
  return findSavedSolicitation(
    vendorId,
    solicitationId,
  );
}