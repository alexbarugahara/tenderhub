import Stripe from "stripe";

import type {
  PaymentCheckoutInput,
  PaymentCheckoutResult,
  PaymentRefundInput,
  PaymentRefundResult,
  PaymentVerificationInput,
  PaymentVerificationResult,
} from "@/lib/payments/payment-provider";

const STRIPE_API_VERSION = "2026-08-26.dahlia";

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return key;
}

function getStripeClient(): Stripe {
  return new Stripe(getStripeSecretKey(), {
    apiVersion: STRIPE_API_VERSION,
  });
}

function toStripeAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payment amount must be greater than zero.");
  }

  return Math.round(amount * 100);
}

function fromStripeAmount(amount?: number | null): number | undefined {
  if (amount === undefined || amount === null) {
    return undefined;
  }

  return amount / 100;
}

function normalizeCurrency(currency: string): string {
  return currency.trim().toLowerCase();
}

function getPaymentStatus(paymentIntent: Stripe.PaymentIntent): boolean {
  return paymentIntent.status === "succeeded";
}

export async function createStripeCheckout(
  input: PaymentCheckoutInput,
): Promise<PaymentCheckoutResult> {
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: normalizeCurrency(input.currency),
          product_data: {
            name: input.description || "TenderHub Payment",
          },
          unit_amount: toStripeAmount(input.amount),
        },
        quantity: 1,
      },
    ],
    customer_email: input.customer.email,
    success_url: input.returnUrl,
    cancel_url: input.returnUrl,
    client_reference_id: input.reference,
    metadata: {
      reference: input.reference,
      ...(input.metadata
        ? Object.fromEntries(
            Object.entries(input.metadata).map(([key, value]) => [
              key,
              String(value),
            ]),
          )
        : {}),
    },
  });

  return {
    success: true,
    reference: input.reference,
    provider: "STRIPE",
    checkoutUrl: session.url ?? undefined,
    transactionId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : undefined,
    message: "Stripe checkout session created.",
    rawResponse: session,
  };
}

export async function verifyStripePayment(
  input: PaymentVerificationInput,
): Promise<PaymentVerificationResult> {
  const stripe = getStripeClient();

  let paymentIntentId = input.transactionId;

  if (!paymentIntentId) {
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    const matchingSession = sessions.data.find(
      (session) =>
        session.client_reference_id === input.reference ||
        session.metadata?.reference === input.reference,
    );

    if (
      matchingSession?.payment_intent &&
      typeof matchingSession.payment_intent === "string"
    ) {
      paymentIntentId = matchingSession.payment_intent;
    }
  }

  if (!paymentIntentId) {
    return {
      success: false,
      paid: false,
      reference: input.reference,
      provider: "STRIPE",
      message: "No Stripe payment intent was found.",
    };
  }

  const paymentIntent =
    await stripe.paymentIntents.retrieve(paymentIntentId);

  return {
    success: true,
    paid: getPaymentStatus(paymentIntent),
    reference: input.reference,
    provider: "STRIPE",
    transactionId: paymentIntent.id,
    amount: fromStripeAmount(paymentIntent.amount),
    currency: paymentIntent.currency?.toUpperCase(),
    message: `Stripe payment status: ${paymentIntent.status}.`,
    rawResponse: paymentIntent,
  };
}

export async function refundStripePayment(
  input: PaymentRefundInput,
): Promise<PaymentRefundResult> {
  const stripe = getStripeClient();

  if (!input.transactionId) {
    return {
      success: false,
      refunded: false,
      reference: input.reference,
      provider: "STRIPE",
      message: "A Stripe payment intent ID is required for refunds.",
    };
  }

  const refund = await stripe.refunds.create({
    payment_intent: input.transactionId,
    amount:
      input.amount !== undefined
        ? toStripeAmount(input.amount)
        : undefined,
    reason: "requested_by_customer",
    metadata: {
      reference: input.reference,
      ...(input.reason ? { reason: input.reason } : {}),
    },
  });

  return {
    success: refund.status === "succeeded",
    refunded: refund.status === "succeeded",
    reference: input.reference,
    provider: "STRIPE",
    transactionId: input.transactionId,
    message: `Stripe refund status: ${refund.status}.`,
    rawResponse: refund,
  };
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function createStripeClient(): Stripe {
  return getStripeClient();
}