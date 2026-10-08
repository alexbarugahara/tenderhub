import Stripe from "stripe";

import { createStripeClient } from "./client";

export interface StripeWebhookResult {
  success: boolean;
  eventId?: string;
  eventType?: string;
  reference?: string;
  transactionId?: string;
  paid?: boolean;
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
}

function getWebhookSecret(): string {
  const secret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not configured.",
    );
  }

  return secret;
}

function getReferenceFromMetadata(
  metadata?: Stripe.Metadata | null,
): string | undefined {
  return (
    metadata?.reference ??
    metadata?.paymentReference ??
    undefined
  );
}

function getAmount(
  amount?: number | null,
): number | undefined {
  if (
    amount === undefined ||
    amount === null
  ) {
    return undefined;
  }

  return amount / 100;
}

export function constructStripeWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  const stripe =
    createStripeClient();

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    getWebhookSecret(),
  );
}

export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  return constructStripeWebhookEvent(
    payload,
    signature,
  );
}

export function parseStripeWebhookEvent(
  event: Stripe.Event,
): StripeWebhookResult {
  switch (event.type) {
    case "checkout.session.completed": {
      const session =
        event.data.object as Stripe.Checkout.Session;

      const reference =
        getReferenceFromMetadata(
          session.metadata,
        ) ??
        session.client_reference_id ??
        undefined;

      const paymentIntent =
        typeof session.payment_intent ===
        "string"
          ? session.payment_intent
          : undefined;

      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        reference,
        transactionId:
          paymentIntent,
        paid:
          session.payment_status ===
          "paid",
        amount: getAmount(
          session.amount_total,
        ),
        currency:
          session.currency?.toUpperCase(),
        message:
          session.payment_status ===
          "paid"
            ? "Stripe checkout payment completed."
            : "Stripe checkout session completed but payment is not marked as paid.",
      };
    }

    case "payment_intent.succeeded": {
      const paymentIntent =
        event.data.object as Stripe.PaymentIntent;

      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        reference:
          getReferenceFromMetadata(
            paymentIntent.metadata,
          ),
        transactionId:
          paymentIntent.id,
        paid: true,
        amount: getAmount(
          paymentIntent.amount,
        ),
        currency:
          paymentIntent.currency?.toUpperCase(),
        message:
          "Stripe payment succeeded.",
      };
    }

    case "payment_intent.payment_failed": {
      const paymentIntent =
        event.data.object as Stripe.PaymentIntent;

      const failureMessage =
        paymentIntent.last_payment_error
          ?.message;

      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        reference:
          getReferenceFromMetadata(
            paymentIntent.metadata,
          ),
        transactionId:
          paymentIntent.id,
        paid: false,
        amount: getAmount(
          paymentIntent.amount,
        ),
        currency:
          paymentIntent.currency?.toUpperCase(),
        message:
          failureMessage ??
          "Stripe payment failed.",
      };
    }

    case "charge.refunded": {
      const charge =
        event.data.object as Stripe.Charge;

      const paymentIntent =
        typeof charge.payment_intent ===
        "string"
          ? charge.payment_intent
          : undefined;

      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        transactionId:
          paymentIntent,
        paid: false,
        amount: getAmount(
          charge.amount_refunded,
        ),
        currency:
          charge.currency?.toUpperCase(),
        message:
          "Stripe payment refund processed.",
      };
    }

    default:
      return {
        success: true,
        eventId: event.id,
        eventType: event.type,
        message:
          "Stripe event received and acknowledged.",
      };
  }
}

export async function handleStripeWebhook(
  payload: string | Buffer,
  signature: string,
): Promise<StripeWebhookResult> {
  try {
    const event =
      constructStripeWebhookEvent(
        payload,
        signature,
      );

    return parseStripeWebhookEvent(
      event,
    );
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to verify Stripe webhook.",
    };
  }
}

export function isStripeWebhookConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_WEBHOOK_SECRET,
  );
}