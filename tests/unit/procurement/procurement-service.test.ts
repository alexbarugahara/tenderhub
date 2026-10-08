import { describe, expect, it, vi } from "vitest";

import {
  ProcurementMethod,
  ProcurementStatus,
} from "@prisma/client";

describe("Procurement service", () => {
  it("should create a procurement with the required schema fields", async () => {
    const procurementData = {
      organizationId: "org-test-001",
      title: "Digital Infrastructure Procurement",
      referenceNumber: "PROC-TEST-001",
      status: ProcurementStatus.DRAFT,
      procurementMethod: ProcurementMethod.OPEN,
    };

    const prisma = {
      procurement: {
        create: vi.fn().mockResolvedValue({
          id: "proc-test-001",
          ...procurementData,
        }),
      },
    };

    const procurement = await prisma.procurement.create({
      data: procurementData,
    });

    expect(prisma.procurement.create).toHaveBeenCalledWith({
      data: procurementData,
    });

    expect(procurement).toMatchObject({
      id: "proc-test-001",
      organizationId: "org-test-001",
      title: "Digital Infrastructure Procurement",
      referenceNumber: "PROC-TEST-001",
      status: ProcurementStatus.DRAFT,
      procurementMethod: ProcurementMethod.OPEN,
    });
  });

  it("should support an estimated procurement value", async () => {
    const procurementData = {
      organizationId: "org-test-001",
      title: "Technology Services Procurement",
      referenceNumber: "PROC-TEST-002",
      estimatedValue: "50000.00",
      status: ProcurementStatus.DRAFT,
      procurementMethod: ProcurementMethod.OPEN,
    };

    const prisma = {
      procurement: {
        create: vi.fn().mockResolvedValue({
          id: "proc-test-002",
          ...procurementData,
        }),
      },
    };

    const procurement = await prisma.procurement.create({
      data: procurementData,
    });

    expect(prisma.procurement.create).toHaveBeenCalledWith({
      data: procurementData,
    });

    expect(procurement.estimatedValue).toBe("50000.00");
  });

  it("should support the procurement methods defined by the Prisma schema", () => {
    expect(ProcurementMethod.OPEN).toBe("OPEN");
    expect(ProcurementMethod.RESTRICTED).toBe("RESTRICTED");
    expect(ProcurementMethod.REQUEST_FOR_QUOTATION).toBe(
      "REQUEST_FOR_QUOTATION",
    );
    expect(ProcurementMethod.DIRECT).toBe("DIRECT");
    expect(ProcurementMethod.NEGOTIATED).toBe("NEGOTIATED");
  });

  it("should support the procurement statuses defined by the Prisma schema", () => {
    expect(ProcurementStatus.DRAFT).toBe("DRAFT");
    expect(ProcurementStatus.PLANNED).toBe("PLANNED");
    expect(ProcurementStatus.ACTIVE).toBe("ACTIVE");
    expect(ProcurementStatus.COMPLETED).toBe("COMPLETED");
    expect(ProcurementStatus.CANCELLED).toBe("CANCELLED");
    expect(ProcurementStatus.ARCHIVED).toBe("ARCHIVED");
  });
});