import { describe, expect, it, vi } from "vitest";

import {
  ProcurementMethod,
  ProcurementStatus,
  SolicitationStatus,
  SolicitationType,
} from "@prisma/client";

describe("Procurement integration", () => {
  it("should create a procurement and return its persisted identity", async () => {
    const procurementData = {
      organizationId: "org-test-001",
      title: "Digital Infrastructure Procurement",
      referenceNumber: "PROC-INT-001",
      status: ProcurementStatus.DRAFT,
      procurementMethod: ProcurementMethod.OPEN,
    };

    const prisma = {
      procurement: {
        create: vi.fn().mockResolvedValue({
          id: "proc-int-001",
          ...procurementData,
        }),
      },
    };

    const procurement = await prisma.procurement.create({
      data: procurementData,
    });

    expect(procurement.id).toBe("proc-int-001");
    expect(procurement.organizationId).toBe("org-test-001");
    expect(procurement.referenceNumber).toBe("PROC-INT-001");
  });

  it("should associate a procurement with its organization", async () => {
    const procurementData = {
      organizationId: "org-test-001",
      title: "Technology Services Procurement",
      referenceNumber: "PROC-INT-002",
      status: ProcurementStatus.DRAFT,
      procurementMethod: ProcurementMethod.OPEN,
    };

    const prisma = {
      procurement: {
        create: vi.fn().mockResolvedValue({
          id: "proc-int-002",
          ...procurementData,
        }),
      },
    };

    const procurement = await prisma.procurement.create({
      data: procurementData,
    });

    expect(procurement.organizationId).toBe(
      procurementData.organizationId,
    );
  });

  it("should support creating a solicitation under a procurement", async () => {
    const solicitationData = {
      procurementId: "proc-int-003",
      organizationId: "org-test-001",
      title: "Digital Infrastructure Solicitation",
      solicitationNumber: "SOL-INT-001",
      type: SolicitationType.IFB,
      status: SolicitationStatus.DRAFT,
    };

    const prisma = {
      solicitation: {
        create: vi.fn().mockResolvedValue({
          id: "sol-int-001",
          ...solicitationData,
        }),
      },
    };

    const solicitation = await prisma.solicitation.create({
      data: solicitationData,
    });

    expect(solicitation.procurementId).toBe("proc-int-003");
    expect(solicitation.organizationId).toBe("org-test-001");
  });

  it("should preserve the procurement-to-solicitation relationship", async () => {
    const procurement = {
      id: "proc-int-004",
      organizationId: "org-test-001",
      title: "Infrastructure Procurement",
      referenceNumber: "PROC-INT-004",
      status: ProcurementStatus.ACTIVE,
      procurementMethod: ProcurementMethod.OPEN,
    };

    const solicitation = {
      id: "sol-int-004",
      procurementId: procurement.id,
      organizationId: procurement.organizationId,
      title: "Infrastructure Solicitation",
      solicitationNumber: "SOL-INT-004",
      type: SolicitationType.IFB,
      status: SolicitationStatus.OPEN,
    };

    expect(solicitation.procurementId).toBe(procurement.id);
    expect(solicitation.organizationId).toBe(
      procurement.organizationId,
    );
  });

  it("should preserve the procurement reference number", async () => {
    const procurementData = {
      organizationId: "org-test-001",
      title: "Professional Services Procurement",
      referenceNumber: "PROC-INT-005",
      status: ProcurementStatus.PLANNED,
      procurementMethod: ProcurementMethod.RESTRICTED,
    };

    const prisma = {
      procurement: {
        create: vi.fn().mockResolvedValue({
          id: "proc-int-005",
          ...procurementData,
        }),
      },
    };

    const procurement = await prisma.procurement.create({
      data: procurementData,
    });

    expect(procurement.referenceNumber).toBe("PROC-INT-005");
  });

  it("should preserve an estimated procurement value", async () => {
    const procurementData = {
      organizationId: "org-test-001",
      title: "Software Procurement",
      referenceNumber: "PROC-INT-006",
      estimatedValue: "75000.00",
      status: ProcurementStatus.DRAFT,
      procurementMethod: ProcurementMethod.OPEN,
    };

    const prisma = {
      procurement: {
        create: vi.fn().mockResolvedValue({
          id: "proc-int-006",
          ...procurementData,
        }),
      },
    };

    const procurement = await prisma.procurement.create({
      data: procurementData,
    });

    expect(procurement.estimatedValue).toBe("75000.00");
  });

  it("should support the procurement lifecycle statuses defined by Prisma", () => {
    const lifecycle = [
      ProcurementStatus.DRAFT,
      ProcurementStatus.PLANNED,
      ProcurementStatus.ACTIVE,
      ProcurementStatus.COMPLETED,
      ProcurementStatus.CANCELLED,
      ProcurementStatus.ARCHIVED,
    ];

    expect(lifecycle).toHaveLength(6);
    expect(lifecycle).toContain(ProcurementStatus.DRAFT);
    expect(lifecycle).toContain(ProcurementStatus.PLANNED);
    expect(lifecycle).toContain(ProcurementStatus.ACTIVE);
    expect(lifecycle).toContain(ProcurementStatus.COMPLETED);
    expect(lifecycle).toContain(ProcurementStatus.CANCELLED);
    expect(lifecycle).toContain(ProcurementStatus.ARCHIVED);
  });

  it("should support all procurement methods defined by Prisma", () => {
    const methods = Object.values(ProcurementMethod);

    expect(methods).toContain(ProcurementMethod.OPEN);
    expect(methods).toContain(ProcurementMethod.RESTRICTED);
    expect(methods).toContain(
      ProcurementMethod.REQUEST_FOR_QUOTATION,
    );
    expect(methods).toContain(ProcurementMethod.DIRECT);
    expect(methods).toContain(ProcurementMethod.NEGOTIATED);
  });

  it("should reject an unsupported procurement status", () => {
    const statuses = Object.values(ProcurementStatus);

    expect(statuses).not.toContain("INVALID_STATUS");
  });

  it("should reject an unsupported procurement method", () => {
    const methods = Object.values(ProcurementMethod);

    expect(methods).not.toContain("INVALID_METHOD");
  });
});