"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PaymentData = {
id: string;
reference: string;
amount: string | number;
status: string;
provider: string | null;
checkoutUrl: string | null;
currency?: {
id: string;
code: string;
symbol: string | null;
decimals: number;
} | null;
};

type CheckoutResponse = {
success: boolean;
message?: string;
error?: string;
data?: {
payment: PaymentData;
checkoutUrl: string;
reference: string;
provider: string;
description?: string | null;
metadata?: Record<string, unknown> | null;
};
};

type ExistingPaymentResponse = {
success: boolean;
message?: string;
error?: string;
data?: PaymentData;
};

export default function CheckoutPageContent() {
const router = useRouter();
const searchParams = useSearchParams();

const initialReference = searchParams.get("reference") || "";
const initialAmount = searchParams.get("amount") || "";
const initialCurrencyId = searchParams.get("currencyId") || "";
const initialType = searchParams.get("type") || "SUBSCRIPTION";
const initialDescription = searchParams.get("description") || "";

const [reference, setReference] = useState(initialReference);
const [amount, setAmount] = useState(initialAmount);
const [currencyId, setCurrencyId] = useState(initialCurrencyId);
const [type, setType] = useState(initialType);
const [description, setDescription] = useState(initialDescription);

const [payment, setPayment] = useState<PaymentData | null>(null);
const [loading, setLoading] = useState(false);
const [checking, setChecking] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

useEffect(() => {
if (!initialReference) {
return;
}


const loadExistingPayment = async () => {
  setChecking(true);
  setError("");

  try {
    const response = await fetch(
      `/api/payments/checkout?reference=${encodeURIComponent(
        initialReference
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return;
    }

    const data =
      (await response.json()) as ExistingPaymentResponse;

    if (data.success && data.data) {
      setPayment(data.data);

      if (data.data.amount !== undefined) {
        setAmount(String(data.data.amount));
      }

      if (data.data.reference) {
        setReference(data.data.reference);
      }

      if (data.data.currency?.id) {
        setCurrencyId(data.data.currency.id);
      }
    }
  } catch {
    // The checkout form can still be used if no existing payment is found.
  } finally {
    setChecking(false);
  }
};

void loadExistingPayment();


}, [initialReference]);

const formatAmount = (
value: string | number,
currency?: PaymentData["currency"]
) => {
const numericValue = Number(value);


if (!Number.isFinite(numericValue)) {
  return String(value);
}

const currencyCode = currency?.code || "USD";

try {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: currency?.decimals ?? 2,
    maximumFractionDigits: currency?.decimals ?? 2,
  }).format(numericValue);
} catch {
  return `${currency?.symbol || ""}${numericValue.toFixed(
    currency?.decimals ?? 2
  )}`;
}


};

const getStatusLabel = (status: string) => {
switch (status) {
case "PAID":
return "Paid";
case "FAILED":
return "Failed";
case "REFUNDED":
return "Refunded";
case "PENDING":
return "Pending";
default:
return status;
}
};

const getStatusClasses = (status: string) => {
switch (status) {
case "PAID":
return "bg-green-100 text-green-700";
case "FAILED":
return "bg-red-100 text-red-700";
case "REFUNDED":
return "bg-purple-100 text-purple-700";
default:
return "bg-yellow-100 text-yellow-700";
}
};

const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
event.preventDefault();


setLoading(true);
setError("");
setSuccess("");

try {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    setError("Please enter a valid amount greater than zero.");
    return;
  }

  const response = await fetch("/api/payments/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: numericAmount,
      currencyId: currencyId || undefined,
      type,
      reference: reference || undefined,
      description: description || undefined,
      provider: "DEMO",
    }),
  });

  const data = (await response.json()) as CheckoutResponse;

  if (!response.ok || !data.success) {
    setError(data.error || "Unable to initialize checkout.");
    return;
  }

  if (!data.data) {
    setError(
      "Checkout was initialized but no payment information was returned."
    );
    return;
  }

  setPayment(data.data.payment);
  setReference(data.data.reference);

  setSuccess(
    "Checkout initialized successfully. You can continue with the payment below."
  );
} catch (checkoutError) {
  console.error("Checkout error:", checkoutError);

  setError(
    "Something went wrong while initializing the payment. Please try again."
  );
} finally {
  setLoading(false);
}


};

const handleContinue = () => {
if (!payment) {
return;
}


if (payment.status === "PAID") {
  router.push("/dashboard");
  return;
}

if (payment.checkoutUrl) {
  const checkoutUrl = payment.checkoutUrl;

  if (checkoutUrl.startsWith("/")) {
    router.push(checkoutUrl);
    return;
  }

  window.location.href = checkoutUrl;
}


};

return ( <main className="min-h-screen bg-tenderhub-background px-4 py-10 sm:px-6 lg:px-8"> <div className="mx-auto max-w-3xl"> <div className="mb-8 text-center"> <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-tenderhub-navy text-xl font-bold text-white">
TH </div>


      <h1 className="text-3xl font-bold tracking-tight text-tenderhub-navy">
        Secure Checkout
      </h1>

      <p className="mt-2 text-sm text-gray-600">
        Complete your TenderHub payment securely.
      </p>
    </div>

    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-6 py-5 sm:px-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Payment Details
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Enter the payment information below to initialize your checkout.
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {checking && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Checking existing payment...
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {!payment && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Amount
              </label>

              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
              />
            </div>

            <div>
              <label
                htmlFor="currencyId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Currency ID
              </label>

              <input
                id="currencyId"
                name="currencyId"
                type="text"
                value={currencyId}
                onChange={(event) => setCurrencyId(event.target.value)}
                placeholder="Optional currency ID"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
              />

              <p className="mt-1 text-xs text-gray-500">
                Leave empty if the payment does not require a specific
                currency record.
              </p>
            </div>

            <div>
              <label
                htmlFor="type"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Payment Type
              </label>

              <select
                id="type"
                name="type"
                value={type}
                onChange={(event) => setType(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
              >
                <option value="SUBSCRIPTION">Subscription</option>
                <option value="APPLICATION_FEE">
                  Application Fee
                </option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="reference"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Payment Reference
              </label>

              <input
                id="reference"
                name="reference"
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Leave blank to generate automatically"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="What is this payment for?"
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-tenderhub-navy px-5 py-3 font-semibold text-white transition hover:bg-tenderhub-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Initializing Checkout..."
                : "Continue to Checkout"}
            </button>
          </form>
        )}

        {payment && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Payment Summary
                </h2>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                    payment.status
                  )}`}
                >
                  {getStatusLabel(payment.status)}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">
                    Amount
                  </span>

                  <span className="font-semibold text-gray-900">
                    {formatAmount(payment.amount, payment.currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">
                    Reference
                  </span>

                  <span className="break-all text-right text-sm font-medium text-gray-900">
                    {payment.reference}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-500">
                    Provider
                  </span>

                  <span className="text-sm font-medium text-gray-900">
                    {payment.provider || "Demo"}
                  </span>
                </div>

                {payment.currency && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-500">
                      Currency
                    </span>

                    <span className="text-sm font-medium text-gray-900">
                      {payment.currency.code}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {payment.status === "PAID" ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
                    ✓
                  </div>

                  <div>
                    <h3 className="font-semibold text-green-900">
                      Payment completed
                    </h3>

                    <p className="mt-1 text-sm text-green-700">
                      Your payment has been successfully completed.
                    </p>
                  </div>
                </div>
              </div>
            ) : payment.status === "FAILED" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <h3 className="font-semibold text-red-900">
                  Payment failed
                </h3>

                <p className="mt-1 text-sm text-red-700">
                  The payment could not be completed. Please try again.
                </p>
              </div>
            ) : payment.status === "REFUNDED" ? (
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
                <h3 className="font-semibold text-purple-900">
                  Payment refunded
                </h3>

                <p className="mt-1 text-sm text-purple-700">
                  This payment has been refunded.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
                <h3 className="font-semibold text-yellow-900">
                  Payment pending
                </h3>

                <p className="mt-1 text-sm text-yellow-700">
                  Your payment is waiting to be completed.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              {payment.status !== "PAID" &&
                payment.status !== "REFUNDED" && (
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="flex-1 rounded-lg bg-tenderhub-navy px-5 py-3 font-semibold text-white transition hover:bg-tenderhub-navy/90"
                  >
                    Continue to Payment
                  </button>
                )}

              {payment.status === "PAID" && (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="flex-1 rounded-lg bg-tenderhub-navy px-5 py-3 font-semibold text-white transition hover:bg-tenderhub-navy/90"
                >
                  Go to Dashboard
                </button>
              )}

              {payment.status !== "PAID" &&
                payment.status !== "REFUNDED" && (
                  <button
                    type="button"
                    onClick={() => {
                      setPayment(null);
                      setSuccess("");
                      setError("");
                    }}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Start Another Payment
                  </button>
                )}
            </div>

            <p className="text-center text-xs text-gray-500">
              TenderHub payment reference: {payment.reference}
            </p>
          </div>
        )}
      </div>
    </div>

    <p className="mt-6 text-center text-xs text-gray-500">
      TenderHub • Secure procurement and payment management
    </p>
  </div>
</main>


);
}
