import {
  ContractPaymentStatus,
  Prisma,
} from "@prisma/client";

import {
  createContractPayment,
  deleteContractPayment,
  findContractPaymentById,
  listContractPayments,
  updateContractPayment,
  updateContractPaymentStatus,
} from "@/lib/db/repositories/contract.repository";

export interface CreateContractPaymentInput {
  contractId: string;
  amount: number | string | Prisma.Decimal;
  currencyId?: string | null;
  paymentDate?: Date | null;
  status?: ContractPaymentStatus;
  reference?: string | null;
  notes?: string | null;
}

export interface UpdateContractPaymentInput {
  amount?: number | string | Prisma.Decimal;
  currencyId?: string | null;
  paymentDate?: Date | null;
  status?: ContractPaymentStatus;
  reference?: string | null;
  notes?: string | null;
}

export interface ListContractPaymentsInput {
  contractId: string;
  status?: ContractPaymentStatus;
  page?: number;
  pageSize?: number;
}

function normalizeRequiredString(
  value: string | undefined | null,
  fieldName: string,
): string {
  if (value === undefined || value === null || value.trim() === "") {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function normalizeOptionalString(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function normalizeDecimal(
  value: number | string | Prisma.Decimal,
): Prisma.Decimal {
  try {
    const decimal = new Prisma.Decimal(value);

    if (!decimal.isFinite()) {
      throw new Error(
        "Payment amount must be a valid number.",
      );
    }

    if (decimal.isNegative()) {
      throw new Error(
        "Payment amount cannot be negative.",
      );
    }

    return decimal;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Payment amount must be a valid number.",
    );
  }
}

function normalizeOptionalDate(
  value: Date | null | undefined,
  fieldName: string,
): Date | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return value;
}

function normalizePage(
  value: number | undefined,
  defaultValue: number,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return defaultValue;
  }

  return Math.floor(value);
}

function normalizePageSize(
  value: number | undefined,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return 20;
  }

  return Math.min(
    100,
    Math.max(1, Math.floor(value)),
  );
}

export async function getContractPaymentById(
  id: string,
) {
  const paymentId = normalizeRequiredString(
    id,
    "Contract payment ID",
  );

  return findContractPaymentById(paymentId);
}

export async function getContractPayments(
  input: ListContractPaymentsInput,
) {
  const contractId = normalizeRequiredString(
    input.contractId,
    "Contract ID",
  );

  const page = Math.max(
    1,
    normalizePage(input.page, 1),
  );

  const pageSize = normalizePageSize(input.pageSize);

  const skip = (page - 1) * pageSize;

  return listContractPayments({
    contractId,
    status: input.status,
    skip,
    take: pageSize,
  });
}

export async function createNewContractPayment(
  input: CreateContractPaymentInput,
) {
  const contractId = normalizeRequiredString(
    input.contractId,
    "Contract ID",
  );

  const amount = normalizeDecimal(input.amount);

  const currencyId =
    input.currencyId === null
      ? undefined
      : normalizeOptionalString(input.currencyId);

  const paymentDate = normalizeOptionalDate(
    input.paymentDate,
    "Payment date",
  );

  const reference = normalizeOptionalString(
    input.reference,
  );

  const notes = normalizeOptionalString(input.notes);

  if (reference && reference.length > 255) {
    throw new Error(
      "Payment reference cannot exceed 255 characters.",
    );
  }

  if (notes && notes.length > 10000) {
    throw new Error(
      "Payment notes cannot exceed 10,000 characters.",
    );
  }

  const status =
    input.status ?? ContractPaymentStatus.PENDING;

  const data: Prisma.ContractPaymentCreateInput = {
    contract: {
      connect: {
        id: contractId,
      },
    },

    amount,

    currency: currencyId
      ? {
          connect: {
            id: currencyId,
          },
        }
      : undefined,

    paymentDate,
    status,
    reference,
    notes,
  };

  return createContractPayment(data);
}

export async function editContractPayment(
  id: string,
  input: UpdateContractPaymentInput,
) {
  const paymentId = normalizeRequiredString(
    id,
    "Contract payment ID",
  );

  const payment = await findContractPaymentById(
    paymentId,
  );

  if (!payment) {
    throw new Error(
      "Contract payment not found.",
    );
  }

  if (
    payment.status === ContractPaymentStatus.PAID ||
    payment.status === ContractPaymentStatus.CANCELLED
  ) {
    throw new Error(
      "A paid or cancelled payment cannot be edited.",
    );
  }

  const data: Prisma.ContractPaymentUpdateInput = {};

  if (input.amount !== undefined) {
    data.amount = normalizeDecimal(input.amount);
  }

  if (input.currencyId !== undefined) {
    if (input.currencyId === null) {
      data.currency = {
        disconnect: true,
      };
    } else {
      data.currency = {
        connect: {
          id: normalizeRequiredString(
            input.currencyId,
            "Currency ID",
          ),
        },
      };
    }
  }

  if (input.paymentDate !== undefined) {
    data.paymentDate = normalizeOptionalDate(
      input.paymentDate,
      "Payment date",
    );
  }

  if (input.status !== undefined) {
    if (
      !Object.values(
        ContractPaymentStatus,
      ).includes(input.status)
    ) {
      throw new Error(
        "Invalid contract payment status.",
      );
    }

    data.status = input.status;
  }

  if (input.reference !== undefined) {
    const reference = normalizeOptionalString(
      input.reference,
    );

    if (reference && reference.length > 255) {
      throw new Error(
        "Payment reference cannot exceed 255 characters.",
      );
    }

    data.reference = reference;
  }

  if (input.notes !== undefined) {
    const notes = normalizeOptionalString(
      input.notes,
    );

    if (notes && notes.length > 10000) {
      throw new Error(
        "Payment notes cannot exceed 10,000 characters.",
      );
    }

    data.notes = notes;
  }

  return updateContractPayment(
    paymentId,
    data,
  );
}

export async function changeContractPaymentStatus(
  id: string,
  status: ContractPaymentStatus,
) {
  const paymentId = normalizeRequiredString(
    id,
    "Contract payment ID",
  );

  if (
    !Object.values(
      ContractPaymentStatus,
    ).includes(status)
  ) {
    throw new Error(
      "Invalid contract payment status.",
    );
  }

  const payment = await findContractPaymentById(
    paymentId,
  );

  if (!payment) {
    throw new Error(
      "Contract payment not found.",
    );
  }

  if (
    payment.status === ContractPaymentStatus.PAID &&
    status !== ContractPaymentStatus.PAID
  ) {
    throw new Error(
      "A paid payment cannot be moved to another status.",
    );
  }

  if (
    payment.status ===
      ContractPaymentStatus.CANCELLED &&
    status !== ContractPaymentStatus.CANCELLED
  ) {
    throw new Error(
      "A cancelled payment cannot be moved to another status.",
    );
  }

  if (
    status === ContractPaymentStatus.PAID
  ) {
    return updateContractPayment(
      paymentId,
      {
        status: ContractPaymentStatus.PAID,
        paymentDate:
          payment.paymentDate ?? new Date(),
      },
    );
  }

  return updateContractPaymentStatus(
    paymentId,
    status,
  );
}

export async function approveContractPayment(
  id: string,
) {
  const paymentId = normalizeRequiredString(
    id,
    "Contract payment ID",
  );

  const payment = await findContractPaymentById(
    paymentId,
  );

  if (!payment) {
    throw new Error(
      "Contract payment not found.",
    );
  }

  if (
    payment.status !==
    ContractPaymentStatus.PENDING
  ) {
    throw new Error(
      "Only pending payments can be approved.",
    );
  }

  return updateContractPaymentStatus(
    paymentId,
    ContractPaymentStatus.APPROVED,
  );
}

export async function markContractPaymentPaid(
  id: string,
) {
  const paymentId = normalizeRequiredString(
    id,
    "Contract payment ID",
  );

  const payment = await findContractPaymentById(
    paymentId,
  );

  if (!payment) {
    throw new Error(
      "Contract payment not found.",
    );
  }

  if (
    payment.status !==
      ContractPaymentStatus.APPROVED &&
    payment.status !==
      ContractPaymentStatus.PENDING
  ) {
    throw new Error(
      "Only pending or approved payments can be marked as paid.",
    );
  }

  return updateContractPayment(
    paymentId,
    {
      status: ContractPaymentStatus.PAID,
      paymentDate:
        payment.paymentDate ?? new Date(),
    },
  );
}

export async function cancelContractPayment(
  id: string,
) {
  const paymentId = normalizeRequiredString(
    id,
    "Contract payment ID",
  );

  const payment = await findContractPaymentById(
    paymentId,
  );

  if (!payment) {
    throw new Error(
      "Contract payment not found.",
    );
  }

  if (
    payment.status ===
    ContractPaymentStatus.PAID
  ) {
    throw new Error(
      "A paid payment cannot be cancelled.",
    );
  }

  if (
    payment.status ===
    ContractPaymentStatus.CANCELLED
  ) {
    throw new Error(
      "Payment is already cancelled.",
    );
  }

  return updateContractPaymentStatus(
    paymentId,
    ContractPaymentStatus.CANCELLED,
  );
}

export async function removeContractPayment(
  id: string,
) {
  const paymentId = normalizeRequiredString(
    id,
    "Contract payment ID",
  );

  const payment = await findContractPaymentById(
    paymentId,
  );

  if (!payment) {
    throw new Error(
      "Contract payment not found.",
    );
  }

  if (
    payment.status ===
    ContractPaymentStatus.PAID
  ) {
    throw new Error(
      "A paid payment cannot be deleted.",
    );
  }

  return deleteContractPayment(paymentId);
}