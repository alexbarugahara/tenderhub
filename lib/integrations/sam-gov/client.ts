export interface SamGovSearchParams {
  q?: string;
  organizationName?: string;
  solicitationNumber?: string;
  noticeType?: string;
  postedFrom?: string;
  postedTo?: string;
  limit?: number;
  offset?: number;
}

export interface SamGovNotice {
  noticeId?: string;
  solicitationNumber?: string;
  title?: string;
  description?: string;
  noticeType?: string;
  organizationName?: string;
  department?: string;
  office?: string;
  postedDate?: string;
  responseDeadline?: string;
  placeOfPerformance?: string;
  estimatedValue?: number;
  url?: string;
  raw?: Record<string, unknown>;
}

export interface SamGovSearchResult {
  totalRecords: number;
  notices: SamGovNotice[];
  raw?: unknown;
}

export interface SamGovClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
}

const DEFAULT_BASE_URL =
  "https://api.sam.gov/opportunities/v2/search";

const DEFAULT_TIMEOUT_MS = 15_000;

function getApiKey(
  explicitApiKey?: string,
): string | undefined {
  return (
    explicitApiKey?.trim() ||
    process.env.SAM_GOV_API_KEY?.trim() ||
    undefined
  );
}

function getBaseUrl(
  explicitBaseUrl?: string,
): string {
  return (
    explicitBaseUrl?.trim() ||
    process.env.SAM_GOV_API_URL?.trim() ||
    DEFAULT_BASE_URL
  );
}

function normalizeLimit(
  limit?: number,
): number {
  if (!limit || !Number.isFinite(limit)) {
    return 10;
  }

  return Math.min(
    Math.max(Math.floor(limit), 1),
    100,
  );
}

function normalizeOffset(
  offset?: number,
): number {
  if (
    offset === undefined ||
    !Number.isFinite(offset)
  ) {
    return 0;
  }

  return Math.max(
    Math.floor(offset),
    0,
  );
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs,
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers ?? {}),
      },
      cache: "no-store",
    });

    const text = await response.text();

    let data: unknown = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
          ? data.message
          : `SAM.gov request failed with status ${response.status}.`;

      throw new Error(message);
    }

    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeNotice(
  value: Record<string, unknown>,
): SamGovNotice {
  return {
    noticeId:
      typeof value.noticeId === "string"
        ? value.noticeId
        : undefined,

    solicitationNumber:
      typeof value.solicitationNumber === "string"
        ? value.solicitationNumber
        : undefined,

    title:
      typeof value.title === "string"
        ? value.title
        : undefined,

    description:
      typeof value.description === "string"
        ? value.description
        : undefined,

    noticeType:
      typeof value.type === "string"
        ? value.type
        : typeof value.noticeType === "string"
          ? value.noticeType
          : undefined,

    organizationName:
      typeof value.fullParentPathName === "string"
        ? value.fullParentPathName
        : typeof value.organizationName === "string"
          ? value.organizationName
          : undefined,

    department:
      typeof value.department === "string"
        ? value.department
        : undefined,

    office:
      typeof value.office === "string"
        ? value.office
        : undefined,

    postedDate:
      typeof value.postedDate === "string"
        ? value.postedDate
        : undefined,

    responseDeadline:
      typeof value.responseDeadLine === "string"
        ? value.responseDeadLine
        : typeof value.responseDeadline === "string"
          ? value.responseDeadline
          : undefined,

    placeOfPerformance:
      typeof value.placeOfPerformance === "string"
        ? value.placeOfPerformance
        : undefined,

    estimatedValue:
      typeof value.estimatedValue === "number"
        ? value.estimatedValue
        : undefined,

    url:
      typeof value.uiLink === "string"
        ? value.uiLink
        : typeof value.url === "string"
          ? value.url
          : undefined,

    raw: value,
  };
}

function extractNotices(
  data: unknown,
): {
  totalRecords: number;
  notices: SamGovNotice[];
} {
  if (
    typeof data !== "object" ||
    data === null
  ) {
    return {
      totalRecords: 0,
      notices: [],
    };
  }

  const record = data as Record<
    string,
    unknown
  >;

  const rawNotices =
    Array.isArray(record.opportunitiesData)
      ? record.opportunitiesData
      : Array.isArray(record.notices)
        ? record.notices
        : [];

  const notices = rawNotices
    .filter(
      (
        item,
      ): item is Record<string, unknown> =>
        typeof item === "object" &&
        item !== null,
    )
    .map(normalizeNotice);

  const totalRecords =
    typeof record.totalRecords === "number"
      ? record.totalRecords
      : notices.length;

  return {
    totalRecords,
    notices,
  };
}

export class SamGovClient {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    options: SamGovClientOptions = {},
  ) {
    this.apiKey = getApiKey(
      options.apiKey,
    );

    this.baseUrl = getBaseUrl(
      options.baseUrl,
    );

    this.timeoutMs =
      options.timeoutMs ??
      DEFAULT_TIMEOUT_MS;
  }

  private requireApiKey(): string {
    if (!this.apiKey) {
      throw new Error(
        "SAM.gov API key is not configured. Set SAM_GOV_API_KEY.",
      );
    }

    return this.apiKey;
  }

  async search(
    params: SamGovSearchParams = {},
  ): Promise<SamGovSearchResult> {
    const apiKey =
      this.requireApiKey();

    const searchParams =
      new URLSearchParams();

    searchParams.set(
      "api_key",
      apiKey,
    );

    searchParams.set(
      "limit",
      String(normalizeLimit(params.limit)),
    );

    searchParams.set(
      "offset",
      String(normalizeOffset(params.offset)),
    );

    if (params.q?.trim()) {
      searchParams.set(
        "q",
        params.q.trim(),
      );
    }

    if (params.organizationName?.trim()) {
      searchParams.set(
        "organizationName",
        params.organizationName.trim(),
      );
    }

    if (params.solicitationNumber?.trim()) {
      searchParams.set(
        "solicitationNumber",
        params.solicitationNumber.trim(),
      );
    }

    if (params.noticeType?.trim()) {
      searchParams.set(
        "ptype",
        params.noticeType.trim(),
      );
    }

    if (params.postedFrom?.trim()) {
      searchParams.set(
        "postedFrom",
        params.postedFrom.trim(),
      );
    }

    if (params.postedTo?.trim()) {
      searchParams.set(
        "postedTo",
        params.postedTo.trim(),
      );
    }

    const url =
      `${this.baseUrl}?${searchParams.toString()}`;

    const data = await request<unknown>(
      url,
      {},
      this.timeoutMs,
    );

    const result =
      extractNotices(data);

    return {
      ...result,
      raw: data,
    };
  }

  async getNotice(
    noticeId: string,
  ): Promise<SamGovNotice | null> {
    const normalizedId =
      noticeId.trim();

    if (!normalizedId) {
      throw new Error(
        "SAM.gov notice ID is required.",
      );
    }

    const result =
      await this.search({
        q: normalizedId,
        limit: 1,
      });

    return (
      result.notices[0] ?? null
    );
  }

  async searchBySolicitationNumber(
    solicitationNumber: string,
  ): Promise<SamGovNotice | null> {
    const normalizedNumber =
      solicitationNumber.trim();

    if (!normalizedNumber) {
      throw new Error(
        "Solicitation number is required.",
      );
    }

    const result =
      await this.search({
        solicitationNumber:
          normalizedNumber,
        limit: 1,
      });

    return (
      result.notices[0] ?? null
    );
  }

  async searchByOrganization(
    organizationName: string,
    limit = 10,
  ): Promise<SamGovSearchResult> {
    const normalizedName =
      organizationName.trim();

    if (!normalizedName) {
      throw new Error(
        "Organization name is required.",
      );
    }

    return this.search({
      organizationName:
        normalizedName,
      limit,
    });
  }

  async searchByKeyword(
    query: string,
    limit = 10,
  ): Promise<SamGovSearchResult> {
    const normalizedQuery =
      query.trim();

    if (!normalizedQuery) {
      throw new Error(
        "Search query is required.",
      );
    }

    return this.search({
      q: normalizedQuery,
      limit,
    });
  }
}

export function createSamGovClient(
  options: SamGovClientOptions = {},
): SamGovClient {
  return new SamGovClient(options);
}

export const samGovClient =
  createSamGovClient();