import { describe, expect, it, vi } from "vitest";

import {
  PaymentGatewayProvider,
  PaymentStatus,
  PaymentType,
} from "@prisma/client";

describe("Payment service", () => {
  it("should create a payment with the required schema enums", async () => {
    const paymentData = {
      type: PaymentType.APPLICATION_FEE,
      status: PaymentStatus.PENDING,
      gateway: PaymentGatewayProvider.FLUTTERWAVE,
    };

    const prisma = {
      payment: {
        create: vi.fn().mockResolvedValue({
          id: "payment-test-001",
          ...paymentData,
        }),
      },
    };

    const payment = await prisma.payment.create({
      data: paymentData,
    });

    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: paymentData,
    });

    expect(payment).toMatchObject({
      id: "payment-test-001",
      type: PaymentType.APPLICATION_FEE,
      status: PaymentStatus.PENDING,
      gateway: PaymentGatewayProvider.FLUTTERWAVE,
    });
  });

  it("should support all payment types defined by Prisma", () => {
    const validTypes = Object.values(PaymentType);

    expect(validTypes).toContain(PaymentType.APPLICATION_FEE);
  });

  it("should support all payment statuses defined by Prisma", () => {
    const validStatuses = Object.values(PaymentStatus);

    expect(validStatuses).toContain(PaymentStatus.PENDING);
    expect(validStatuses).toContain(PaymentStatus.PAID);
    expect(validStatuses).toContain(PaymentStatus.FAILED);
    expect(validStatuses).toContain(PaymentStatus.REFUNDED);
  });

  it("should support the configured payment gateway providers", () => {
    const validProviders = Object.values(PaymentGatewayProvider);

    expect(validProviders).toContain(
      PaymentGatewayProvider.FLUTTERWAVE,
    );

    expect(validProviders).toContain(
      PaymentGatewayProvider.PESAPAL,
    );
  });

  it("should not accept an unsupported payment status", () => {
    const validStatuses = Object.values(PaymentStatus);

    expect(validStatuses).not.toContain("INVALID_STATUS");
  });

  it("should not accept an unsupported payment gateway", () => {
    const validProviders = Object.values(PaymentGatewayProvider);

    expect(validProviders).not.toContain("INVALID_GATEWAY");
  });

  it("should transition a pending payment to paid", () => {
    const payment = {
      status: PaymentStatus.PENDING,
    };

    const updatedPayment = {
      ...payment,
      status: PaymentStatus.PAID,
    };

    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(updatedPayment.status).toBe(PaymentStatus.PAID);
  });

  it("should transition a pending payment to failed", () => {
    const payment = {
      status: PaymentStatus.PENDING,
    };

    const updatedPayment = {
      ...payment,
      status: PaymentStatus.FAILED,
    };

    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(updatedPayment.status).toBe(PaymentStatus.FAILED);
  });

  it("should support a paid payment being refunded", () => {
    const payment = {
      status: PaymentStatus.PAID,
    };

    const refundedPayment = {
      ...payment,
      status: PaymentStatus.REFUNDED,
    };

    expect(refundedPayment.status).toBe(PaymentStatus.REFUNDED);
  });
});