import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type WebhookPayload = {
  reference?: string;
  transactionId?: string;
  status?: string;
  amount?: number | string;
  provider?: string;
  failureReason?: string;
  paidAt?: string;
};

const SUCCESS_STATUSES = new Set([
  "PAID",
  "SUCCESS",
  "COMPLETED",
  "SUCCESSFUL",
]);

const FAILED_STATUSES = new Set([
  "FAILED",
  "FAILURE",
  "CANCELLED",
  "CANCELED",
]);

const REFUNDED_STATUSES = new Set([
  "REFUNDED",
]);

function normalizeStatus(status?: string) {
  return status?.trim().toUpperCase() || "";
}

function parseAmount(value: number | string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const amount =
    typeof value === "string"
      ? Number(value)
      : value;

  if (!Number.isFinite(amount) || amount < 0) {
    return undefined;
  }

  return amount;
}

function parsePaidAt(value?: string) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date();
  }

  return date;
}

export async function POST(request: NextRequest) {
  try {
    let body: WebhookPayload;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON webhook payload",
        },
        { status: 400 }
      );
    }

    const reference = body.reference?.trim();

    if (!reference) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment reference is required",
        },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: {
        reference,
      },
      select: {
        id: true,
        userId: true,
        amount: true,
        reference: true,
        status: true,
        provider: true,
        transactionId: true,
        paidAt: true,
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment not found",
        },
        { status: 404 }
      );
    }

    const incomingStatus = normalizeStatus(body.status);

    if (!incomingStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment status is required",
        },
        { status: 400 }
      );
    }

    const incomingAmount = parseAmount(body.amount);

    if (body.amount !== undefined && incomingAmount === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment amount",
        },
        { status: 400 }
      );
    }

    if (
      incomingAmount !== undefined &&
      Number(payment.amount) !== incomingAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment amount does not match the original payment",
        },
        { status: 400 }
      );
    }

    const incomingProvider = body.provider?.trim().toUpperCase();

    if (
      incomingProvider &&
      payment.provider &&
      incomingProvider !== payment.provider
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment provider does not match the original payment",
        },
        { status: 400 }
      );
    }

    let newStatus:
      | "PENDING"
      | "PAID"
      | "FAILED"
      | "REFUNDED";

    if (SUCCESS_STATUSES.has(incomingStatus)) {
      newStatus = "PAID";
    } else if (FAILED_STATUSES.has(incomingStatus)) {
      newStatus = "FAILED";
    } else if (REFUNDED_STATUSES.has(incomingStatus)) {
      newStatus = "REFUNDED";
    } else {
      newStatus = "PENDING";
    }

    if (
      payment.status === "PAID" &&
      newStatus !== "PAID"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A completed payment cannot be changed by this webhook",
        },
        { status: 409 }
      );
    }

    if (
      payment.status === "REFUNDED" &&
      newStatus !== "REFUNDED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A refunded payment cannot be changed by this webhook",
        },
        { status: 409 }
      );
    }

    const transactionId =
      body.transactionId?.trim() ||
      payment.transactionId ||
      undefined;

    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: newStatus,
        transactionId,
        failureReason:
          newStatus === "FAILED"
            ? body.failureReason?.trim() || "Payment failed"
            : null,
        paidAt:
          newStatus === "PAID"
            ? payment.paidAt || parsePaidAt(body.paidAt)
            : newStatus === "REFUNDED"
              ? payment.paidAt
              : null,
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

    return NextResponse.json({
      success: true,
      message: "Payment webhook processed successfully",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Payment webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process payment webhook",
      },
      { status: 500 }
    );
  }
}