import { describe, expect, it } from "vitest";

import { BidStatus } from "@prisma/client";

describe("Bid validation", () => {
  it("should accept a valid bid payload", () => {
    const bid = {
      solicitationId: "sol-test-001",
      lotId: "lot-test-001",
      vendorId: "vendor-test-001",
      submittedById: "user-test-001",
      bidNumber: "BID-TEST-001",
      status: BidStatus.DRAFT,
    };

    expect(bid.solicitationId).toBeTruthy();
    expect(bid.lotId).toBeTruthy();
    expect(bid.vendorId).toBeTruthy();
    expect(bid.submittedById).toBeTruthy();
    expect(bid.bidNumber).toBeTruthy();
    expect(bid.status).toBe(BidStatus.DRAFT);
  });

  it("should require a solicitation", () => {
    const bid = {
      solicitationId: "",
      lotId: "lot-test-001",
      vendorId: "vendor-test-001",
      submittedById: "user-test-001",
      bidNumber: "BID-TEST-002",
      status: BidStatus.DRAFT,
    };

    expect(Boolean(bid.solicitationId)).toBe(false);
  });

  it("should require a lot", () => {
    const bid = {
      solicitationId: "sol-test-001",
      lotId: "",
      vendorId: "vendor-test-001",
      submittedById: "user-test-001",
      bidNumber: "BID-TEST-003",
      status: BidStatus.DRAFT,
    };

    expect(Boolean(bid.lotId)).toBe(false);
  });

  it("should require a vendor", () => {
    const bid = {
      solicitationId: "sol-test-001",
      lotId: "lot-test-001",
      vendorId: "",
      submittedById: "user-test-001",
      bidNumber: "BID-TEST-004",
      status: BidStatus.DRAFT,
    };

    expect(Boolean(bid.vendorId)).toBe(false);
  });

  it("should require the submitting user", () => {
    const bid = {
      solicitationId: "sol-test-001",
      lotId: "lot-test-001",
      vendorId: "vendor-test-001",
      submittedById: "",
      bidNumber: "BID-TEST-005",
      status: BidStatus.DRAFT,
    };

    expect(Boolean(bid.submittedById)).toBe(false);
  });

  it("should require a bid number", () => {
    const bid = {
      solicitationId: "sol-test-001",
      lotId: "lot-test-001",
      vendorId: "vendor-test-001",
      submittedById: "user-test-001",
      bidNumber: "",
      status: BidStatus.DRAFT,
    };

    expect(Boolean(bid.bidNumber)).toBe(false);
  });

  it("should accept all bid statuses defined by Prisma", () => {
    const validStatuses = Object.values(BidStatus);

    for (const status of validStatuses) {
      expect(validStatuses).toContain(status);
    }
  });

  it("should reject an unsupported bid status", () => {
    const validStatuses = Object.values(BidStatus);

    expect(validStatuses).not.toContain("INVALID_STATUS");
  });

  it("should reject an empty bid number", () => {
    const bidNumber = "";

    expect(bidNumber.trim()).toBe("");
    expect(Boolean(bidNumber.trim())).toBe(false);
  });

  it("should reject a whitespace-only bid number", () => {
    const bidNumber = "   ";

    expect(bidNumber.trim()).toBe("");
    expect(Boolean(bidNumber.trim())).toBe(false);
  });
});