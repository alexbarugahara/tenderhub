import {
  PaymentGatewayProvider,
} from "@prisma/client";

export interface PaymentCustomer {
  email: string;
  name?: string;
  phone?: string;
}

export interface PaymentCheckoutInput {
  reference: string;
  amount: number;
  currency: string;
  customer: PaymentCustomer;
  returnUrl: string;
  description?: string;
  metadata?: Record<
    string,
    string | number | boolean
  >;
}

export interface PaymentCheckoutResult {
  success: boolean;
  reference: string;
  provider: PaymentGatewayProvider;
  checkoutUrl?: string;
  transactionId?: string;
  message?: string;
  rawResponse?: unknown;
}

export interface PaymentVerificationInput {
  reference: string;
  transactionId?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  paid: boolean;
  reference: string;
  provider: PaymentGatewayProvider;
  transactionId?: string;
  amount?: number;
  currency?: string;
  message?: string;
  rawResponse?: unknown;
}

export interface PaymentRefundInput {
  reference: string;
  transactionId?: string;
  amount?: number;
  reason?: string;
}

export interface PaymentRefundResult {
  success: boolean;
  refunded: boolean;
  reference: string;
  provider: PaymentGatewayProvider;
  transactionId?: string;
  message?: string;
  rawResponse?: unknown;
}

export interface PaymentProvider {
  readonly provider: PaymentGatewayProvider;

  createCheckout(
    input: PaymentCheckoutInput,
  ): Promise<PaymentCheckoutResult>;

  verifyPayment(
    input: PaymentVerificationInput,
  ): Promise<PaymentVerificationResult>;

  refundPayment(
    input: PaymentRefundInput,
  ): Promise<PaymentRefundResult>;
}

function validateAmount(
  amount: number,
): void {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Payment amount must be greater than zero.",
    );
  }
}

function validateCurrency(
  currency: string,
): string {
  const normalized =
    currency.trim().toUpperCase();

  if (!normalized) {
    throw new Error(
      "Payment currency is required.",
    );
  }

  return normalized;
}

function validateReference(
  reference: string,
): string {
  const normalized =
    reference.trim();

  if (!normalized) {
    throw new Error(
      "Payment reference is required.",
    );
  }

  return normalized;
}

function validateCustomer(
  customer: PaymentCustomer,
): void {
  if (!customer?.email?.trim()) {
    throw new Error(
      "Customer email is required.",
    );
  }
}

function validateCheckoutInput(
  input: PaymentCheckoutInput,
): PaymentCheckoutInput {
  validateAmount(input.amount);

  const currency =
    validateCurrency(
      input.currency,
    );

  const reference =
    validateReference(
      input.reference,
    );

  validateCustomer(
    input.customer,
  );

  if (!input.returnUrl?.trim()) {
    throw new Error(
      "Payment return URL is required.",
    );
  }

  return {
    ...input,
    reference,
    currency,
  };
}

export class DemoPaymentProvider
  implements PaymentProvider
{
  readonly provider =
    PaymentGatewayProvider.DEMO;

  async createCheckout(
    input: PaymentCheckoutInput,
  ): Promise<PaymentCheckoutResult> {
    const validated =
      validateCheckoutInput(
        input,
      );

    const transactionId =
      `DEMO_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 10)}`;

    const checkoutUrl =
      `${validated.returnUrl}?reference=${encodeURIComponent(
        validated.reference,
      )}&provider=DEMO`;

    return {
      success: true,
      reference:
        validated.reference,
      provider:
        this.provider,
      checkoutUrl,
      transactionId,
      message:
        "Demo payment checkout created.",
    };
  }

  async verifyPayment(
    input: PaymentVerificationInput,
  ): Promise<PaymentVerificationResult> {
    const reference =
      validateReference(
        input.reference,
      );

    return {
      success: true,
      paid: true,
      reference,
      provider:
        this.provider,
      transactionId:
        input.transactionId,
      message:
        "Demo payment verified successfully.",
    };
  }

  async refundPayment(
    input: PaymentRefundInput,
  ): Promise<PaymentRefundResult> {
    const reference =
      validateReference(
        input.reference,
      );

    if (
      input.amount !== undefined
    ) {
      validateAmount(
        input.amount,
      );
    }

    return {
      success: true,
      refunded: true,
      reference,
      provider:
        this.provider,
      transactionId:
        input.transactionId,
      message:
        "Demo payment refunded successfully.",
    };
  }
}

export function getPaymentProvider(
  provider: PaymentGatewayProvider,
): PaymentProvider {
  switch (provider) {
    case PaymentGatewayProvider.DEMO:
      return new DemoPaymentProvider();

    case PaymentGatewayProvider.STRIPE:
      throw new Error(
        "Stripe payment provider is not configured yet.",
      );

    case PaymentGatewayProvider.FLUTTERWAVE:
      throw new Error(
        "Flutterwave payment provider is not configured yet.",
      );

    case PaymentGatewayProvider.PESAPAL:
      throw new Error(
        "Pesapal payment provider is not configured yet.",
      );

    default:
      throw new Error(
        `Unsupported payment provider: ${provider}`,
      );
  }
}

export function isPaymentProviderConfigured(
  provider: PaymentGatewayProvider,
): boolean {
  switch (provider) {
    case PaymentGatewayProvider.DEMO:
      return true;

    case PaymentGatewayProvider.STRIPE:
      return Boolean(
        process.env.STRIPE_SECRET_KEY,
      );

    case PaymentGatewayProvider.FLUTTERWAVE:
      return Boolean(
        process.env.FLUTTERWAVE_SECRET_KEY,
      );

    case PaymentGatewayProvider.PESAPAL:
      return Boolean(
        process.env.PESAPAL_CONSUMER_KEY &&
          process.env.PESAPAL_CONSUMER_SECRET,
      );

    default:
      return false;
  }
}

export function getConfiguredPaymentProviders(): PaymentGatewayProvider[] {
  return Object.values(
    PaymentGatewayProvider,
  ).filter(
    isPaymentProviderConfigured,
  );
}

export function normalizePaymentProvider(
  provider: string,
): PaymentGatewayProvider {
  const normalized =
    provider.trim().toUpperCase();

  switch (normalized) {
    case "STRIPE":
      return PaymentGatewayProvider.STRIPE;

    case "FLUTTERWAVE":
      return PaymentGatewayProvider.FLUTTERWAVE;

    case "PESAPAL":
      return PaymentGatewayProvider.PESAPAL;

    case "DEMO":
      return PaymentGatewayProvider.DEMO;

    default:
      throw new Error(
        `Unsupported payment provider: ${provider}`,
      );
  }
}