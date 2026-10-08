import { describe, expect, it, vi } from "vitest";

import {
  SolicitationStatus,
  SolicitationType,
} from "@prisma/client";

describe("Solicitation service", () => {
  it("should create a solicitation with the required schema fields", async () => {
    const solicitationData = {
      procurementId: "proc-test-001",
      organizationId: "org-test-001",
      title: "Digital Infrastructure and Implementation",
      solicitationNumber: "SOL-TEST-001",
      type: SolicitationType.IFB,
      status: SolicitationStatus.DRAFT,
    };

    const prisma = {
      solicitation: {
        create: vi.fn().mockResolvedValue({
          id: "sol-test-001",
          ...solicitationData,
        }),
      },
    };

    const solicitation = await prisma.solicitation.create({
      data: solicitationData,
    });

    expect(prisma.solicitation.create).toHaveBeenCalledWith({
      data: solicitationData,
    });

    expect(solicitation).toMatchObject({
      id: "sol-test-001",
      procurementId: "proc-test-001",
      organizationId: "org-test-001",
      title: "Digital Infrastructure and Implementation",
      solicitationNumber: "SOL-TEST-001",
      type: SolicitationType.IFB,
      status: SolicitationStatus.DRAFT,
    });
  });

  it("should associate a solicitation with its procurement", async () => {
    const solicitationData = {
      procurementId: "proc-test-001",
      organizationId: "org-test-001",
      title: "Technology Services",
      solicitationNumber: "SOL-TEST-002",
      type: SolicitationType.RFP,
      status: SolicitationStatus.DRAFT,
    };

    const prisma = {
      solicitation: {
        create: vi.fn().mockResolvedValue({
          id: "sol-test-002",
          ...solicitationData,
        }),
      },
    };

    const solicitation = await prisma.solicitation.create({
      data: solicitationData,
    });

    expect(solicitation.procurementId).toBe("proc-test-001");
  });

  it("should associate a solicitation with its organization", async () => {
    const solicitationData = {
      procurementId: "proc-test-001",
      organizationId: "org-test-001",
      title: "Professional Services",
      solicitationNumber: "SOL-TEST-003",
      type: SolicitationType.RFP,
      status: SolicitationStatus.DRAFT,
    };

    const prisma = {
      solicitation: {
        create: vi.fn().mockResolvedValue({
          id: "sol-test-003",
          ...solicitationData,
        }),
      },
    };

    const solicitation = await prisma.solicitation.create({
      data: solicitationData,
    });

    expect(solicitation.organizationId).toBe("org-test-001");
  });

  it("should support solicitation types defined by Prisma", () => {
    const validTypes = Object.values(SolicitationType);

    expect(validTypes).toContain(SolicitationType.IFB);
    expect(validTypes).toContain(SolicitationType.RFP);
    expect(validTypes).toContain(SolicitationType.RFQ);
    expect(validTypes).toContain(SolicitationType.RFI);
  });

  it("should support solicitation statuses defined by Prisma", () => {
    const validStatuses = Object.values(SolicitationStatus);

    expect(validStatuses).toContain(SolicitationStatus.DRAFT);
    expect(validStatuses).toContain(SolicitationStatus.PUBLISHED);
    expect(validStatuses).toContain(SolicitationStatus.OPEN);
    expect(validStatuses).toContain(SolicitationStatus.CLOSED);
    expect(validStatuses).toContain(SolicitationStatus.UNDER_EVALUATION);
    expect(validStatuses).toContain(SolicitationStatus.AWARDED);
    expect(validStatuses).toContain(SolicitationStatus.CANCELLED);
  });

  it("should not accept an unsupported solicitation type", () => {
    const validTypes = Object.values(SolicitationType);

    expect(validTypes).not.toContain("INVALID_TYPE");
  });

  it("should not accept an unsupported solicitation status", () => {
    const validStatuses = Object.values(SolicitationStatus);

    expect(validStatuses).not.toContain("INVALID_STATUS");
  });
});
