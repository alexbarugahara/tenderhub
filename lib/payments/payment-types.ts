import type {
  PaymentGatewayProvider,
  PaymentStatus,
  PaymentType,
} from "@prisma/client";

export interface PaymentMetadata {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined;
}

export interface PaymentCustomer {
  email: string;
  name?: string;
  phone?: string;
}

export interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  reference: string;
  type: PaymentType;
  provider: PaymentGatewayProvider;
  customer: PaymentCustomer;
  returnUrl: string;
  description?: string;
  metadata?: PaymentMetadata;
}

export interface PaymentCheckoutData {
  paymentId?: string;
  userId: string;
  amount: number;
  currency: string;
  reference: string;
  type: PaymentType;
  provider: PaymentGatewayProvider;
  customer: PaymentCustomer;
  returnUrl: string;
  description?: string;
  metadata?: PaymentMetadata;
}

export interface PaymentCheckoutResponse {
  success: boolean;
  paymentId?: string;
  reference: string;
  provider: PaymentGatewayProvider;
  checkoutUrl?: string;
  transactionId?: string;
  message?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface PaymentVerificationRequest {
  paymentId?: string;
  reference: string;
  transactionId?: string;
  provider: PaymentGatewayProvider;
}

export interface PaymentVerificationResponse {
  success: boolean;
  paid: boolean;
  paymentId?: string;
  reference: string;
  provider: PaymentGatewayProvider;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  message?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface PaymentWebhookEvent {
  provider: PaymentGatewayProvider;
  reference?: string;
  transactionId?: string;
  status?: PaymentStatus;
  amount?: number;
  currency?: string;
  type?: PaymentType;
  metadata?: PaymentMetadata;
  rawPayload?: unknown;
}

export interface PaymentRefundRequest {
  paymentId?: string;
  reference: string;
  transactionId?: string;
  provider: PaymentGatewayProvider;
  amount?: number;
  reason?: string;
}

export interface PaymentRefundResponse {
  success: boolean;
  refunded: boolean;
  paymentId?: string;
  reference: string;
  provider: PaymentGatewayProvider;
  transactionId?: string;
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface PaymentState {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  reference: string;
  status: PaymentStatus;
  provider: PaymentGatewayProvider | null;
  type: PaymentType;
  transactionId: string | null;
  checkoutUrl: string | null;
  paidAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentSummary {
  total: number;
  pending: number;
  paid: number;
  failed: number;
  refunded: number;
  totalAmount: number;
  paidAmount: number;
}

export interface PaymentProviderConfig {
  provider: PaymentGatewayProvider;
  enabled: boolean;
  configured: boolean;
  currencyCodes: string[];
  supportsCheckout: boolean;
  supportsVerification: boolean;
  supportsRefunds: boolean;
}

export function isPaymentStatusFinal(
  status: PaymentStatus,
): boolean {
  return (
    status === "PAID" ||
    status === "FAILED" ||
    status === "REFUNDED"
  );
}

export function isPaymentSuccessful(
  status: PaymentStatus,
): boolean {
  return status === "PAID";
}

export function isPaymentPending(
  status: PaymentStatus,
): boolean {
  return status === "PENDING";
}

export function isPaymentFailed(
  status: PaymentStatus,
): boolean {
  return status === "FAILED";
}

export function isPaymentRefunded(
  status: PaymentStatus,
): boolean {
  return status === "REFUNDED";
}

export function isSubscriptionPayment(
  type: PaymentType,
): boolean {
  return type === "SUBSCRIPTION";
}

export function isApplicationFeePayment(
  type: PaymentType,
): boolean {
  return type === "APPLICATION_FEE";
}

export function isRefundPayment(
  type: PaymentType,
): boolean {
  return type === "REFUND";
}

export function isOtherPayment(
  type: PaymentType,
): boolean {
  return type === "OTHER";
}

export function createPaymentMetadata(
  values: Record<
    string,
    string | number | boolean | null | undefined
  > = {},
): PaymentMetadata {
  return {
    ...values,
  };
}

export function normalizePaymentMetadata(
  metadata: unknown,
): PaymentMetadata {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return {};
  }

  const result: PaymentMetadata = {};

  for (const [
    key,
    value,
  ] of Object.entries(
    metadata as Record<string, unknown>,
  )) {
    if (
      value === null ||
      value === undefined ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      result[key] = value as
        | string
        | number
        | boolean
        | null
        | undefined;
    }
  }

  return result;
}

export function createPaymentSummary(
  payments: Array<{
    amount: number;
    status: PaymentStatus;
  }>,
): PaymentSummary {
  let pending = 0;
  let paid = 0;
  let failed = 0;
  let refunded = 0;
  let totalAmount = 0;
  let paidAmount = 0;

  for (const payment of payments) {
    totalAmount += payment.amount;

    switch (payment.status) {
      case "PENDING":
        pending += 1;
        break;

      case "PAID":
        paid += 1;
        paidAmount += payment.amount;
        break;

      case "FAILED":
        failed += 1;
        break;

      case "REFUNDED":
        refunded += 1;
        break;
    }
  }

  return {
    total: payments.length,
    pending,
    paid,
    failed,
    refunded,
    totalAmount,
    paidAmount,
  };
}

export function validatePaymentRequest(
  request: PaymentRequest,
): string[] {
  const errors: string[] = [];

  if (!request.userId?.trim()) {
    errors.push(
      "User ID is required.",
    );
  }

  if (
    !Number.isFinite(request.amount) ||
    request.amount <= 0
  ) {
    errors.push(
      "Payment amount must be greater than zero.",
    );
  }

  if (!request.currency?.trim()) {
    errors.push(
      "Payment currency is required.",
    );
  }

  if (!request.reference?.trim()) {
    errors.push(
      "Payment reference is required.",
    );
  }

  if (!request.customer?.email?.trim()) {
    errors.push(
      "Customer email is required.",
    );
  }

  if (!request.returnUrl?.trim()) {
    errors.push(
      "Payment return URL is required.",
    );
  }

  return errors;
}

export function assertValidPaymentRequest(
  request: PaymentRequest,
): void {
  const errors =
    validatePaymentRequest(
      request,
    );

  if (errors.length > 0) {
    throw new Error(
      errors.join(" "),
    );
  }
}