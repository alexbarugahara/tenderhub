import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RefundRequest = {
  reference?: string;
  amount?: number | string;
  reason?: string;
};

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

    let body: RefundRequest;

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

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment not found",
        },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";

    if (!isAdmin && payment.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to refund this payment",
        },
        { status: 403 }
      );
    }

    if (payment.status !== "PAID") {
      return NextResponse.json(
        {
          success: false,
          error: "Only completed payments can be refunded",
        },
        { status: 400 }
      );
    }

    const requestedAmount =
      body.amount === undefined
        ? Number(payment.amount)
        : typeof body.amount === "string"
          ? Number(body.amount)
          : body.amount;

    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Refund amount must be greater than zero",
        },
        { status: 400 }
      );
    }

    if (requestedAmount > Number(payment.amount)) {
      return NextResponse.json(
        {
          success: false,
          error: "Refund amount cannot exceed the original payment amount",
        },
        { status: 400 }
      );
    }

    const reason =
      body.reason?.trim() || "Payment refund requested";

    /*
     * The current Payment model stores one payment record and does not
     * contain a separate refund transaction model. Therefore the refund
     * route records the refund against the existing payment.
     *
     * Provider-specific refund APIs should be connected here when the
     * corresponding production payment gateway is configured.
     */

    const updatedPayment = await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: "REFUNDED",
        failureReason: reason,
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
      message: "Payment refunded successfully",
      data: {
        payment: updatedPayment,
        refundAmount: requestedAmount,
        reason,
      },
    });
  } catch (error) {
    console.error("Payment refund error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to refund payment",
      },
      { status: 500 }
    );
  }
}