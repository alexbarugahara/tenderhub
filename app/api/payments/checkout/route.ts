import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type CheckoutRequest = {
  amount?: number | string;
  currencyId?: string;
  type?: string;
  reference?: string;
  description?: string;
  provider?: string;
  metadata?: Record<string, unknown>;
};

const ALLOWED_PAYMENT_TYPES = [
  "SUBSCRIPTION",
  "APPLICATION_FEE",
  "REFUND",
  "OTHER",
] as const;

const ALLOWED_PROVIDERS = [
  "STRIPE",
  "FLUTTERWAVE",
  "PESAPAL",
  "DEMO",
] as const;

function isValidPaymentType(
  value: string
): value is (typeof ALLOWED_PAYMENT_TYPES)[number] {
  return ALLOWED_PAYMENT_TYPES.includes(
    value as (typeof ALLOWED_PAYMENT_TYPES)[number]
  );
}

function isValidProvider(
  value: string
): value is (typeof ALLOWED_PROVIDERS)[number] {
  return ALLOWED_PROVIDERS.includes(
    value as (typeof ALLOWED_PROVIDERS)[number]
  );
}

function createDemoCheckoutUrl(reference: string) {
  return `/checkout?reference=${encodeURIComponent(reference)}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    let body: CheckoutRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    const rawAmount = body.amount;
    const amount =
      typeof rawAmount === "string"
        ? Number(rawAmount)
        : rawAmount;

    if (
      amount === undefined ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid payment amount greater than zero is required",
        },
        { status: 400 }
      );
    }

    const type = body.type?.trim() || "OTHER";

    if (!isValidPaymentType(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment type",
        },
        { status: 400 }
      );
    }

    const currencyId = body.currencyId?.trim();

    if (currencyId) {
      const currency = await prisma.currency.findUnique({
        where: {
          id: currencyId,
        },
        select: {
          id: true,
          code: true,
          symbol: true,
          decimals: true,
          active: true,
        },
      });

      if (!currency) {
        return NextResponse.json(
          {
            success: false,
            error: "Currency not found",
          },
          { status: 404 }
        );
      }

      if (!currency.active) {
        return NextResponse.json(
          {
            success: false,
            error: "The selected currency is not active",
          },
          { status: 400 }
        );
      }
    }

    let provider = body.provider?.trim() || "DEMO";

    if (!isValidProvider(provider)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment provider",
        },
        { status: 400 }
      );
    }

    const reference =
      body.reference?.trim() ||
      `TH-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)
        .toUpperCase()}`;

    const existingPayment = await prisma.payment.findUnique({
      where: {
        reference,
      },
      select: {
        id: true,
        status: true,
        reference: true,
        amount: true,
        checkoutUrl: true,
      },
    });

    if (existingPayment) {
      if (existingPayment.status === "PAID") {
        return NextResponse.json(
          {
            success: false,
            error: "A payment with this reference has already been completed",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Existing payment checkout returned",
        data: existingPayment,
      });
    }

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        currencyId: currencyId || undefined,
        amount,
        reference,
        type,
        status: "PENDING",
        provider,
      },
      include: {
        currency: {
          select: {
            id: true,
            code: true,
            symbol: true,
            decimals: true,
          },
        },
      },
    });

    let checkoutUrl: string;

    if (provider === "DEMO") {
      checkoutUrl = createDemoCheckoutUrl(reference);
    } else {
      /*
       * Provider-specific checkout creation is intentionally kept behind
       * this route. Real Stripe, Flutterwave, or Pesapal credentials
       * should be configured before production checkout is enabled.
       *
       * Until those credentials and provider integrations are configured,
       * the payment remains PENDING and no external transaction is
       * created here.
       */
      checkoutUrl = createDemoCheckoutUrl(reference);
      provider = "DEMO";

      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          provider: "DEMO",
        },
      });
    }

    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        checkoutUrl,
      },
      include: {
        currency: {
          select: {
            id: true,
            code: true,
            symbol: true,
            decimals: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Checkout initialized successfully",
        data: {
          payment: updatedPayment,
          checkoutUrl,
          reference: updatedPayment.reference,
          provider: updatedPayment.provider,
          description: body.description || null,
          metadata: body.metadata || null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment checkout error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize payment checkout",
      },
      { status: 500 }
    );
  }
}