import { describe, expect, it } from "vitest";

type ComplianceRequirement = {
  id: string;
  required: boolean;
};

type VendorComplianceRecord = {
  requirementId: string;
  status: "COMPLIANT" | "NON_COMPLIANT" | "PENDING" | "EXPIRED";
};

function evaluateCompliance(
  requirements: ComplianceRequirement[],
  records: VendorComplianceRecord[],
): {
  compliant: boolean;
  missing: string[];
  nonCompliant: string[];
  expired: string[];
  pending: string[];
} {
  const missing: string[] = [];
  const nonCompliant: string[] = [];
  const expired: string[] = [];
  const pending: string[] = [];

  for (const requirement of requirements) {
    const record = records.find(
      (item) => item.requirementId === requirement.id,
    );

    if (!record) {
      if (requirement.required) {
        missing.push(requirement.id);
      }

      continue;
    }

    switch (record.status) {
      case "NON_COMPLIANT":
        nonCompliant.push(requirement.id);
        break;

      case "EXPIRED":
        expired.push(requirement.id);
        break;

      case "PENDING":
        pending.push(requirement.id);
        break;
    }
  }

  return {
    compliant:
      missing.length === 0 &&
      nonCompliant.length === 0 &&
      expired.length === 0 &&
      pending.length === 0,
    missing,
    nonCompliant,
    expired,
    pending,
  };
}

describe("Compliance engine", () => {
  it("should mark a vendor compliant when all required requirements are compliant", () => {
    const requirements = [
      { id: "req-001", required: true },
      { id: "req-002", required: true },
      { id: "req-003", required: true },
    ];

    const records = [
      { requirementId: "req-001", status: "COMPLIANT" as const },
      { requirementId: "req-002", status: "COMPLIANT" as const },
      { requirementId: "req-003", status: "COMPLIANT" as const },
    ];

    const result = evaluateCompliance(requirements, records);

    expect(result.compliant).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.nonCompliant).toEqual([]);
    expect(result.expired).toEqual([]);
    expect(result.pending).toEqual([]);
  });

  it("should identify a missing required compliance requirement", () => {
    const requirements = [
      { id: "req-001", required: true },
      { id: "req-002", required: true },
    ];

    const records = [
      { requirementId: "req-001", status: "COMPLIANT" as const },
    ];

    const result = evaluateCompliance(requirements, records);

    expect(result.compliant).toBe(false);
    expect(result.missing).toEqual(["req-002"]);
  });

  it("should identify a non-compliant requirement", () => {
    const requirements = [
      { id: "req-001", required: true },
      { id: "req-002", required: true },
    ];

    const records = [
      { requirementId: "req-001", status: "COMPLIANT" as const },
      { requirementId: "req-002", status: "NON_COMPLIANT" as const },
    ];

    const result = evaluateCompliance(requirements, records);

    expect(result.compliant).toBe(false);
    expect(result.nonCompliant).toEqual(["req-002"]);
  });

  it("should identify an expired requirement", () => {
    const requirements = [
      { id: "req-001", required: true },
      { id: "req-002", required: true },
    ];

    const records = [
      { requirementId: "req-001", status: "COMPLIANT" as const },
      { requirementId: "req-002", status: "EXPIRED" as const },
    ];

    const result = evaluateCompliance(requirements, records);

    expect(result.compliant).toBe(false);
    expect(result.expired).toEqual(["req-002"]);
  });

  it("should identify a pending requirement", () => {
    const requirements = [
      { id: "req-001", required: true },
      { id: "req-002", required: true },
    ];

    const records = [
      { requirementId: "req-001", status: "COMPLIANT" as const },
      { requirementId: "req-002", status: "PENDING" as const },
    ];

    const result = evaluateCompliance(requirements, records);

    expect(result.compliant).toBe(false);
    expect(result.pending).toEqual(["req-002"]);
  });

  it("should not require optional requirements for compliance", () => {
    const requirements = [
      { id: "req-001", required: true },
      { id: "req-002", required: false },
    ];

    const records = [
      { requirementId: "req-001", status: "COMPLIANT" as const },
    ];

    const result = evaluateCompliance(requirements, records);

    expect(result.compliant).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("should still report an optional requirement when it has a non-compliant status", () => {
    const requirements = [
      { id: "req-001", required: true },
      { id: "req-002", required: false },
    ];

    const records = [
      { requirementId: "req-001", status: "COMPLIANT" as const },
      { requirementId: "req-002", status: "NON_COMPLIANT" as const },
    ];

    const result = evaluateCompliance(requirements, records);

    expect(result.compliant).toBe(false);
    expect(result.nonCompliant).toEqual(["req-002"]);
  });

  it("should handle multiple compliance failures", () => {
    const requirements = [
      { id: "req-001", required: true },
      { id: "req-002", required: true },
      { id: "req-003", required: true },
      { id: "req-004", required: true },
    ];

    const records = [
      { requirementId: "req-001", status: "NON_COMPLIANT" as const },
      { requirementId: "req-002", status: "EXPIRED" as const },
      { requirementId: "req-003", status: "PENDING" as const },
    ];

    const result = evaluateCompliance(requirements, records);

    expect(result.compliant).toBe(false);
    expect(result.missing).toEqual(["req-004"]);
    expect(result.nonCompliant).toEqual(["req-001"]);
    expect(result.expired).toEqual(["req-002"]);
    expect(result.pending).toEqual(["req-003"]);
  });

  it("should handle an empty compliance requirement set", () => {
    const result = evaluateCompliance([], []);

    expect(result.compliant).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.nonCompliant).toEqual([]);
    expect(result.expired).toEqual([]);
    expect(result.pending).toEqual([]);
  });

  it("should ignore compliance records that do not match a requirement", () => {
    const requirements = [
      { id: "req-001", required: true },
    ];

    const records = [
      { requirementId: "req-999", status: "NON_COMPLIANT" as const },
    ];

    const result = evaluateCompliance(requirements, records);

    expect(result.compliant).toBe(false);
    expect(result.missing).toEqual(["req-001"]);
    expect(result.nonCompliant).toEqual([]);
  });

  it("should identify compliance only when there are no outstanding issues", () => {
    const requirements = [
      { id: "req-001", required: true },
      { id: "req-002", required: true },
      { id: "req-003", required: false },
    ];

    const records = [
      { requirementId: "req-001", status: "COMPLIANT" as const },
      { requirementId: "req-002", status: "COMPLIANT" as const },
      { requirementId: "req-003", status: "COMPLIANT" as const },
    ];

    const result = evaluateCompliance(requirements, records);

    expect(result.compliant).toBe(true);
    expect(result.missing).toHaveLength(0);
    expect(result.nonCompliant).toHaveLength(0);
    expect(result.expired).toHaveLength(0);
    expect(result.pending).toHaveLength(0);
  });
});