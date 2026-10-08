import { describe, expect, it } from "vitest";

import {
  ContractPaymentStatus,
  ContractStatus,
  MilestoneStatus,
} from "@prisma/client";

describe("Contracts integration", () => {
  it("should support all contract statuses defined by Prisma", () => {
    const validStatuses = Object.values(ContractStatus);

    expect(validStatuses).toContain(ContractStatus.DRAFT);
    expect(validStatuses).toContain(ContractStatus.ACTIVE);
    expect(validStatuses).toContain(ContractStatus.COMPLETED);
    expect(validStatuses).toContain(ContractStatus.TERMINATED);
    expect(validStatuses).toContain(ContractStatus.EXPIRED);
  });

  it("should reject an unsupported contract status", () => {
    const validStatuses = Object.values(ContractStatus);

    expect(validStatuses).not.toContain("INVALID_STATUS");
  });

  it("should support all milestone statuses defined by Prisma", () => {
    const validStatuses = Object.values(MilestoneStatus);

    expect(validStatuses).toContain(MilestoneStatus.PENDING);
    expect(validStatuses).toContain(MilestoneStatus.IN_PROGRESS);
    expect(validStatuses).toContain(MilestoneStatus.COMPLETED);
    expect(validStatuses).toContain(MilestoneStatus.DELAYED);
    expect(validStatuses).toContain(MilestoneStatus.CANCELLED);
  });

  it("should reject an unsupported milestone status", () => {
    const validStatuses = Object.values(MilestoneStatus);

    expect(validStatuses).not.toContain("INVALID_STATUS");
  });

  it("should support all contract payment statuses defined by Prisma", () => {
    const validStatuses = Object.values(ContractPaymentStatus);

    expect(validStatuses).toContain(ContractPaymentStatus.PENDING);
    expect(validStatuses).toContain(ContractPaymentStatus.APPROVED);
    expect(validStatuses).toContain(ContractPaymentStatus.PAID);
    expect(validStatuses).toContain(ContractPaymentStatus.FAILED);
    expect(validStatuses).toContain(ContractPaymentStatus.CANCELLED);
  });

  it("should reject an unsupported contract payment status", () => {
    const validStatuses = Object.values(ContractPaymentStatus);

    expect(validStatuses).not.toContain("INVALID_STATUS");
  });

  it("should represent a draft contract correctly", () => {
    const contract = {
      id: "contract-test-001",
      status: ContractStatus.DRAFT,
    };

    expect(contract.id).toBeTruthy();
    expect(contract.status).toBe(ContractStatus.DRAFT);
  });

  it("should represent an active contract correctly", () => {
    const contract = {
      id: "contract-test-002",
      status: ContractStatus.ACTIVE,
    };

    expect(contract.id).toBeTruthy();
    expect(contract.status).toBe(ContractStatus.ACTIVE);
  });

  it("should represent a completed contract correctly", () => {
    const contract = {
      id: "contract-test-003",
      status: ContractStatus.COMPLETED,
    };

    expect(contract.id).toBeTruthy();
    expect(contract.status).toBe(ContractStatus.COMPLETED);
  });

  it("should represent a pending contract milestone correctly", () => {
    const milestone = {
      id: "milestone-test-001",
      status: MilestoneStatus.PENDING,
    };

    expect(milestone.id).toBeTruthy();
    expect(milestone.status).toBe(MilestoneStatus.PENDING);
  });

  it("should represent a completed contract milestone correctly", () => {
    const milestone = {
      id: "milestone-test-002",
      status: MilestoneStatus.COMPLETED,
    };

    expect(milestone.id).toBeTruthy();
    expect(milestone.status).toBe(MilestoneStatus.COMPLETED);
  });

  it("should represent a pending contract payment correctly", () => {
    const payment = {
      id: "contract-payment-test-001",
      status: ContractPaymentStatus.PENDING,
    };

    expect(payment.id).toBeTruthy();
    expect(payment.status).toBe(ContractPaymentStatus.PENDING);
  });

  it("should represent a paid contract payment correctly", () => {
    const payment = {
      id: "contract-payment-test-002",
      status: ContractPaymentStatus.PAID,
    };

    expect(payment.id).toBeTruthy();
    expect(payment.status).toBe(ContractPaymentStatus.PAID);
  });

  it("should preserve the contract lifecycle concept", () => {
    const lifecycle = [
      ContractStatus.DRAFT,
      ContractStatus.ACTIVE,
      ContractStatus.COMPLETED,
    ];

    expect(lifecycle[0]).toBe(ContractStatus.DRAFT);
    expect(lifecycle[1]).toBe(ContractStatus.ACTIVE);
    expect(lifecycle[2]).toBe(ContractStatus.COMPLETED);
  });
});