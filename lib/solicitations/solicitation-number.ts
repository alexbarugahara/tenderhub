import { prisma } from "@/lib/db/prisma";

export interface SolicitationNumberOptions {
  prefix?: string;
  year?: number;
  sequenceLength?: number;
}

const DEFAULT_SEQUENCE_LENGTH = 4;
const DEFAULT_PREFIX = "SOL";

function normalizePrefix(prefix: string): string {
  return prefix
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeYear(year?: number): number {
  const value = year ?? new Date().getFullYear();

  if (!Number.isInteger(value) || value < 2000 || value > 9999) {
    throw new Error("Invalid solicitation year.");
  }

  return value;
}

function normalizeSequenceLength(
  sequenceLength?: number,
): number {
  const value =
    sequenceLength ?? DEFAULT_SEQUENCE_LENGTH;

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > 10
  ) {
    throw new Error(
      "Solicitation sequence length must be between 1 and 10.",
    );
  }

  return value;
}

export function formatSolicitationNumber(
  sequence: number,
  options: SolicitationNumberOptions = {},
): string {
  if (
    !Number.isInteger(sequence) ||
    sequence < 1
  ) {
    throw new Error(
      "Solicitation sequence must be a positive integer.",
    );
  }

  const prefix = normalizePrefix(
    options.prefix ?? DEFAULT_PREFIX,
  );

  if (!prefix) {
    throw new Error(
      "Solicitation number prefix cannot be empty.",
    );
  }

  const year = normalizeYear(options.year);

  const sequenceLength = normalizeSequenceLength(
    options.sequenceLength,
  );

  const sequencePart = String(sequence).padStart(
    sequenceLength,
    "0",
  );

  return `${prefix}-${year}-${sequencePart}`;
}

export function parseSolicitationNumber(
  solicitationNumber: string,
): {
  prefix: string;
  year: number;
  sequence: number;
} | null {
  const value = solicitationNumber.trim();

  const match = value.match(
    /^([A-Z0-9]+)-(\d{4})-(\d+)$/i,
  );

  if (!match) {
    return null;
  }

  const prefix = match[1].toUpperCase();
  const year = Number(match[2]);
  const sequence = Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(sequence) ||
    sequence < 1
  ) {
    return null;
  }

  return {
    prefix,
    year,
    sequence,
  };
}

export function isValidSolicitationNumber(
  solicitationNumber: string | null | undefined,
): boolean {
  if (!solicitationNumber) {
    return false;
  }

  return (
    parseSolicitationNumber(solicitationNumber) !==
    null
  );
}

export async function solicitationNumberExists(
  solicitationNumber: string,
): Promise<boolean> {
  const existing = await prisma.solicitation.findUnique({
    where: {
      solicitationNumber: solicitationNumber.trim(),
    },
    select: {
      id: true,
    },
  });

  return Boolean(existing);
}

export async function getNextSolicitationSequence(
  options: SolicitationNumberOptions = {},
): Promise<number> {
  const prefix = normalizePrefix(
    options.prefix ?? DEFAULT_PREFIX,
  );

  if (!prefix) {
    throw new Error(
      "Solicitation number prefix cannot be empty.",
    );
  }

  const year = normalizeYear(options.year);

  const pattern = `${prefix}-${year}-%`;

  const solicitations =
    await prisma.solicitation.findMany({
      where: {
        solicitationNumber: {
          startsWith: `${prefix}-${year}-`,
        },
      },
      select: {
        solicitationNumber: true,
      },
      orderBy: {
        solicitationNumber: "desc",
      },
    });

  let highestSequence = 0;

  for (const solicitation of solicitations) {
    const parsed = parseSolicitationNumber(
      solicitation.solicitationNumber,
    );

    if (
      parsed &&
      parsed.prefix === prefix &&
      parsed.year === year &&
      parsed.sequence > highestSequence
    ) {
      highestSequence = parsed.sequence;
    }
  }

  void pattern;

  return highestSequence + 1;
}

export async function generateSolicitationNumber(
  options: SolicitationNumberOptions = {},
): Promise<string> {
  const prefix = normalizePrefix(
    options.prefix ?? DEFAULT_PREFIX,
  );

  const year = normalizeYear(options.year);

  const sequenceLength = normalizeSequenceLength(
    options.sequenceLength,
  );

  let sequence =
    await getNextSolicitationSequence({
      prefix,
      year,
      sequenceLength,
    });

  let number = formatSolicitationNumber(
    sequence,
    {
      prefix,
      year,
      sequenceLength,
    },
  );

  while (await solicitationNumberExists(number)) {
    sequence += 1;

    number = formatSolicitationNumber(
      sequence,
      {
        prefix,
        year,
        sequenceLength,
      },
    );
  }

  return number;
}

export async function generateUniqueSolicitationNumber(
  options: SolicitationNumberOptions = {},
): Promise<string> {
  return generateSolicitationNumber(options);
}

export function getSolicitationNumberPrefix(
  solicitationNumber: string,
): string | null {
  return (
    parseSolicitationNumber(
      solicitationNumber,
    )?.prefix ?? null
  );
}

export function getSolicitationNumberYear(
  solicitationNumber: string,
): number | null {
  return (
    parseSolicitationNumber(
      solicitationNumber,
    )?.year ?? null
  );
}

export function getSolicitationNumberSequence(
  solicitationNumber: string,
): number | null {
  return (
    parseSolicitationNumber(
      solicitationNumber,
    )?.sequence ?? null
  );
}