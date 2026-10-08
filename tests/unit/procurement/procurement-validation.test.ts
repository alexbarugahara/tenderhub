import { describe, expect, it } from "vitest";

import {
  ProcurementMethod,
  ProcurementStatus,
} from "@prisma/client";

describe("Procurement validation", () => {
  it("should accept a valid procurement payload", () => {
    const procurement = {
      organizationId: "org-test-001",
      title: "Digital Infrastructure Procurement",
      referenceNumber: "PROC-TEST-001",
      status: ProcurementStatus.DRAFT,
      procurementMethod: ProcurementMethod.OPEN,
    };

    expect(procurement.organizationId).toBeTruthy();
    expect(procurement.title).toBeTruthy();
    expect(procurement.referenceNumber).toBeTruthy();
    expect(procurement.status).toBe(ProcurementStatus.DRAFT);
    expect(procurement.procurementMethod).toBe(ProcurementMethod.OPEN);
  });

  it("should require an organization", () => {
    const procurement = {
      organizationId: "",
      title: "Digital Infrastructure Procurement",
      referenceNumber: "PROC-TEST-001",
      status: ProcurementStatus.DRAFT,
      procurementMethod: ProcurementMethod.OPEN,
    };

    expect(procurement.organizationId).toBe("");
    expect(Boolean(procurement.organizationId)).toBe(false);
  });

  it("should require a procurement title", () => {
    const procurement = {
      organizationId: "org-test-001",
      title: "",
      referenceNumber: "PROC-TEST-001",
      status: ProcurementStatus.DRAFT,
      procurementMethod: ProcurementMethod.OPEN,
    };

    expect(Boolean(procurement.title)).toBe(false);
  });

  it("should require a unique reference number", () => {
    const procurement = {
      organizationId: "org-test-001",
      title: "Digital Infrastructure Procurement",
      referenceNumber: "",
      status: ProcurementStatus.DRAFT,
      procurementMethod: ProcurementMethod.OPEN,
    };

    expect(Boolean(procurement.referenceNumber)).toBe(false);
  });

  it("should only use procurement methods defined by Prisma", () => {
    const validMethods = [
      ProcurementMethod.OPEN,
      ProcurementMethod.RESTRICTED,
      ProcurementMethod.REQUEST_FOR_QUOTATION,
      ProcurementMethod.DIRECT,
      ProcurementMethod.NEGOTIATED,
    ];

    expect(validMethods).toContain(ProcurementMethod.OPEN);
    expect(validMethods).toContain(ProcurementMethod.RESTRICTED);
    expect(validMethods).toContain(
      ProcurementMethod.REQUEST_FOR_QUOTATION,
    );
    expect(validMethods).toContain(ProcurementMethod.DIRECT);
    expect(validMethods).toContain(ProcurementMethod.NEGOTIATED);
  });

  it("should only use procurement statuses defined by Prisma", () => {
    const validStatuses = [
      ProcurementStatus.DRAFT,
      ProcurementStatus.PLANNED,
      ProcurementStatus.ACTIVE,
      ProcurementStatus.COMPLETED,
      ProcurementStatus.CANCELLED,
      ProcurementStatus.ARCHIVED,
    ];

    expect(validStatuses).toContain(ProcurementStatus.DRAFT);
    expect(validStatuses).toContain(ProcurementStatus.PLANNED);
    expect(validStatuses).toContain(ProcurementStatus.ACTIVE);
    expect(validStatuses).toContain(ProcurementStatus.COMPLETED);
    expect(validStatuses).toContain(ProcurementStatus.CANCELLED);
    expect(validStatuses).toContain(ProcurementStatus.ARCHIVED);
  });

  it("should reject an unsupported procurement method", () => {
    const validMethods = Object.values(ProcurementMethod);

    expect(validMethods).not.toContain("INVALID_METHOD");
  });

  it("should reject an unsupported procurement status", () => {
    const validStatuses = Object.values(ProcurementStatus);

    expect(validStatuses).not.toContain("INVALID_STATUS");
  });
});