import {
  ProcurementMethod,
  ProcurementStatus,
  SolicitationStatus,
  SolicitationType,
} from "@prisma/client";

import type {
  SamGovNotice,
} from "./client";

export interface MappedSamGovSolicitation {
  solicitationNumber: string;
  title: string;
  description?: string;
  status: SolicitationStatus;
  type: SolicitationType;
  procurementMethod: ProcurementMethod;
  publishDate?: Date;
  openDate?: Date;
  closeDate?: Date;
  estimatedValue?: number;
  externalId?: string;
  externalUrl?: string;
  source: string;
  rawData?: Record<string, unknown>;
}

export interface SamGovMappingOptions {
  defaultStatus?: SolicitationStatus;
  defaultType?: SolicitationType;
  defaultProcurementMethod?: ProcurementMethod;
}

const DEFAULT_STATUS =
  SolicitationStatus.PUBLISHED;

const DEFAULT_TYPE =
  SolicitationType.OTHER;

const DEFAULT_PROCUREMENT_METHOD =
  ProcurementMethod.OPEN;

function parseDate(
  value?: string,
): Date | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? undefined
    : date;
}

function normalizeText(
  value?: string,
): string | undefined {
  const normalized =
    value?.trim();

  return normalized
    ? normalized
    : undefined;
}

function mapSolicitationType(
  noticeType?: string,
): SolicitationType {
  const value =
    noticeType
      ?.trim()
      .toUpperCase();

  switch (value) {
    case "RFI":
      return SolicitationType.RFI;

    case "RFQ":
      return SolicitationType.RFQ;

    case "RFP":
      return SolicitationType.RFP;

    case "IFB":
      return SolicitationType.IFB;

    case "ITB":
      return SolicitationType.ITB;

    default:
      return DEFAULT_TYPE;
  }
}

function mapProcurementMethod(
  notice: SamGovNotice,
): ProcurementMethod {
  const noticeType =
    notice.noticeType
      ?.trim()
      .toUpperCase();

  if (
    noticeType === "RFQ" ||
    noticeType === "IFB" ||
    noticeType === "ITB"
  ) {
    return ProcurementMethod.OPEN;
  }

  return DEFAULT_PROCUREMENT_METHOD;
}

function mapSolicitationStatus(
  notice: SamGovNotice,
  options: SamGovMappingOptions,
): SolicitationStatus {
  if (options.defaultStatus) {
    return options.defaultStatus;
  }

  const closeDate =
    parseDate(
      notice.responseDeadline,
    );

  if (
    closeDate &&
    closeDate.getTime() < Date.now()
  ) {
    return SolicitationStatus.CLOSED;
  }

  return DEFAULT_STATUS;
}

function buildDescription(
  notice: SamGovNotice,
): string | undefined {
  const description =
    normalizeText(
      notice.description,
    );

  if (description) {
    return description;
  }

  const organization =
    normalizeText(
      notice.organizationName,
    );

  const place =
    normalizeText(
      notice.placeOfPerformance,
    );

  const parts = [
    organization,
    place,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(" — ")
    : undefined;
}

export function mapSamGovNotice(
  notice: SamGovNotice,
  options: SamGovMappingOptions = {},
): MappedSamGovSolicitation {
  const solicitationNumber =
    normalizeText(
      notice.solicitationNumber,
    ) ??
    normalizeText(
      notice.noticeId,
    ) ??
    `SAM-${Date.now()}`;

  const title =
    normalizeText(notice.title) ??
    "SAM.gov Solicitation";

  const publishDate =
    parseDate(notice.postedDate);

  const closeDate =
    parseDate(
      notice.responseDeadline,
    );

  return {
    solicitationNumber,
    title,
    description:
      buildDescription(notice),

    status:
      mapSolicitationStatus(
        notice,
        options,
      ),

    type:
      options.defaultType ??
      mapSolicitationType(
        notice.noticeType,
      ),

    procurementMethod:
      options.defaultProcurementMethod ??
      mapProcurementMethod(notice),

    publishDate,
    openDate: publishDate,
    closeDate,

    estimatedValue:
      typeof notice.estimatedValue ===
      "number" &&
      Number.isFinite(
        notice.estimatedValue,
      ) &&
      notice.estimatedValue >= 0
        ? notice.estimatedValue
        : undefined,

    externalId:
      normalizeText(
        notice.noticeId,
      ),

    externalUrl:
      normalizeText(
        notice.url,
      ),

    source: "SAM.gov",

    rawData: notice.raw,
  };
}

export function mapSamGovNotices(
  notices: SamGovNotice[],
  options: SamGovMappingOptions = {},
): MappedSamGovSolicitation[] {
  return notices.map(
    (notice) =>
      mapSamGovNotice(
        notice,
        options,
      ),
  );
}

export function mapSamGovNoticeToProcurement(
  notice: SamGovNotice,
): {
  title: string;
  description?: string;
  status: ProcurementStatus;
  procurementMethod: ProcurementMethod;
} {
  return {
    title:
      normalizeText(notice.title) ??
      "SAM.gov Procurement",

    description:
      buildDescription(notice),

    status:
      ProcurementStatus.ACTIVE,

    procurementMethod:
      mapProcurementMethod(notice),
  };
}

export function getSamGovSolicitationNumber(
  notice: SamGovNotice,
): string | undefined {
  return (
    normalizeText(
      notice.solicitationNumber,
    ) ??
    normalizeText(
      notice.noticeId,
    )
  );
}

export function getSamGovExternalId(
  notice: SamGovNotice,
): string | undefined {
  return normalizeText(
    notice.noticeId,
  );
}

export function getSamGovExternalUrl(
  notice: SamGovNotice,
): string | undefined {
  return normalizeText(
    notice.url,
  );
}

export function getSamGovTitle(
  notice: SamGovNotice,
): string {
  return (
    normalizeText(notice.title) ??
    "SAM.gov Solicitation"
  );
}

export function getSamGovPostedDate(
  notice: SamGovNotice,
): Date | undefined {
  return parseDate(
    notice.postedDate,
  );
}

export function getSamGovResponseDeadline(
  notice: SamGovNotice,
): Date | undefined {
  return parseDate(
    notice.responseDeadline,
  );
}