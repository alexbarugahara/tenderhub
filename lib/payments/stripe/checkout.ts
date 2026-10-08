import {
  createStripeCheckout,
  isStripeConfigured,
} from "./client";

import type {
  PaymentCheckoutInput,
  PaymentCheckoutResult,
} from "@/lib/payments/payment-provider";

export interface StripeCheckoutOptions {
  reference: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    name?: string;
    phone?: string;
  };
  returnUrl: string;
  description?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface StripeCheckoutResponse {
  success: boolean;
  reference: string;
  checkoutUrl?: string;
  transactionId?: string;
  message?: string;
  error?: string;
}

type StripeCheckoutInput = PaymentCheckoutInput;

function validateCheckoutInput(
  input: StripeCheckoutInput,
): string[] {
  const errors: string[] = [];

  if (!input.reference.trim()) {
    errors.push("Payment reference is required.");
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.push("Payment amount must be greater than zero.");
  }

  if (!input.currency.trim()) {
    errors.push("Payment currency is required.");
  }

  if (!input.customer.email.trim()) {
    errors.push("Customer email is required.");
  }

  if (!input.returnUrl.trim()) {
    errors.push("Return URL is required.");
  }

  return errors;
}

export async function createCheckoutSession(
  input: StripeCheckoutOptions,
): Promise<StripeCheckoutResponse> {
  const checkoutInput: StripeCheckoutInput = {
    reference: input.reference,
    amount: input.amount,
    currency: input.currency,
    customer: input.customer,
    returnUrl: input.returnUrl,
    description: input.description,
    metadata: input.metadata,
  };

  const errors = validateCheckoutInput(checkoutInput);

  if (errors.length > 0) {
    return {
      success: false,
      reference: input.reference,
      error: errors.join(" "),
      message: "Invalid Stripe checkout input.",
    };
  }

  if (!isStripeConfigured()) {
    return {
      success: false,
      reference: input.reference,
      error: "Stripe is not configured.",
      message: "STRIPE_SECRET_KEY is missing.",
    };
  }

  try {
    const result: PaymentCheckoutResult =
      await createStripeCheckout(checkoutInput);

    return {
      success: result.success,
      reference: result.reference,
      checkoutUrl: result.checkoutUrl,
      transactionId: result.transactionId,
      message: result.message,
      error: result.success ? undefined : result.message,
    };
  } catch (error) {
    return {
      success: false,
      reference: input.reference,
      error:
        error instanceof Error
          ? error.message
          : "Unable to create Stripe checkout session.",
      message: "Stripe checkout failed.",
    };
  }
}

export async function createStripeCheckoutSession(
  input: StripeCheckoutOptions,
): Promise<StripeCheckoutResponse> {
  return createCheckoutSession(input);
}

export function isStripeCheckoutAvailable(): boolean {
  return isStripeConfigured();
}
