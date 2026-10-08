"use client";

import React, { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export type CheckoutPaymentProvider =
  | "STRIPE"
  | "FLUTTERWAVE"
  | "PESAPAL"
  | "DEMO";

export interface CheckoutFormValues {
  amount: number;
  currency: string;
  provider: CheckoutPaymentProvider;
  description: string;
  reference: string;
}

export interface CheckoutFormProps {
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  providers?: CheckoutPaymentProvider[];
  defaultProvider?: CheckoutPaymentProvider;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onSubmit?: (
    values: CheckoutFormValues,
  ) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const providerLabels: Record<
  CheckoutPaymentProvider,
  string
> = {
  STRIPE: "Stripe",
  FLUTTERWAVE: "Flutterwave",
  PESAPAL: "Pesapal",
  DEMO: "Demo Payment",
};

function formatAmount(
  amount: number,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function CheckoutForm({
  amount,
  currency,
  description = "Payment",
  reference = "",
  providers = ["STRIPE"],
  defaultProvider = "STRIPE",
  submitting = false,
  error = null,
  submitLabel = "Continue to Payment",
  onSubmit,
  onCancel,
  className = "",
}: CheckoutFormProps) {
  const initialProvider = providers.includes(
    defaultProvider,
  )
    ? defaultProvider
    : providers[0] ?? "STRIPE";

  const [provider, setProvider] =
    useState<CheckoutPaymentProvider>(
      initialProvider,
    );

  const [formError, setFormError] =
    useState<string | null>(null);

  function validate(): string | null {
    if (!Number.isFinite(amount) || amount <= 0) {
      return "The payment amount must be greater than zero.";
    }

    if (!currency.trim()) {
      return "A payment currency is required.";
    }

    if (!provider) {
      return "Please select a payment method.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!onSubmit) {
      return;
    }

    setFormError(null);

    try {
      await onSubmit({
        amount,
        currency: currency.trim().toUpperCase(),
        provider,
        description: description.trim(),
        reference: reference.trim(),
      });
    } catch (submissionError) {
      setFormError(
        submissionError instanceof Error
          ? submissionError.message
          : "The payment could not be initiated.",
      );
    }
  }

  return (
    <Card className={className}>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Checkout
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review your payment details before
            continuing.
          </p>
        </div>

        {(error || formError) && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {formError ?? error}
          </div>
        )}

        <div className="rounded-xl border border-tenderhub-gold/30 bg-tenderhub-gold/5 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Amount Due
          </p>

          <p className="mt-2 text-3xl font-bold text-tenderhub-navy">
            {formatAmount(amount, currency)}
          </p>

          <p className="mt-2 text-sm text-gray-600">
            {description}
          </p>

          {reference && (
            <div className="mt-4 border-t border-tenderhub-gold/20 pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Reference
              </p>

              <p className="mt-1 break-all font-mono text-sm text-gray-800">
                {reference}
              </p>
            </div>
          )}
        </div>

        <fieldset
          disabled={submitting}
          className="space-y-3"
        >
          <legend className="text-sm font-semibold text-gray-900">
            Payment Method
          </legend>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {providers.map((paymentProvider) => {
              const selected =
                provider === paymentProvider;

              return (
                <label
                  key={paymentProvider}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                    selected
                      ? "border-tenderhub-gold bg-tenderhub-gold/10 ring-1 ring-tenderhub-gold"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  } ${
                    submitting
                      ? "cursor-not-allowed opacity-70"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-provider"
                    value={paymentProvider}
                    checked={selected}
                    onChange={() =>
                      setProvider(
                        paymentProvider,
                      )
                    }
                    className="h-4 w-4 accent-tenderhub-gold"
                  />

                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-gray-900">
                      {
                        providerLabels[
                          paymentProvider
                        ]
                      }
                    </span>

                    <span className="mt-0.5 block text-xs text-gray-500">
                      {paymentProvider ===
                      "DEMO"
                        ? "For testing only"
                        : "Secure payment processing"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs leading-5 text-gray-500">
            Your payment will be processed using the
            selected payment provider. Do not refresh or
            close the page while payment processing is in
            progress.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={
              submitting ||
              !Number.isFinite(amount) ||
              amount <= 0 ||
              providers.length === 0
            }
          >
            {submitting
              ? "Processing..."
              : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}