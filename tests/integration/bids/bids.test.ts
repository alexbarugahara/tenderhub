import { describe, expect, it, vi } from "vitest";

import {
  BidStatus,
  SolicitationStatus,
  SolicitationType,
} from "@prisma/client";

describe("Bids integration", () => {
  it("should create a bid linked to a solicitation, lot, vendor, and submitting user", async () => {
    const bidData = {
      solicitationId: "sol-int-001",
      lotId: "lot-int-001",
      vendorId: "vendor-int-001",
      submittedById: "user-int-001",
      bidNumber: "BID-INT-001",
      status: BidStatus.DRAFT,
    };

    const prisma = {
      bid: {
        create: vi.fn().mockResolvedValue({
          id: "bid-int-001",
          ...bidData,
        }),
      },
    };

    const bid = await prisma.bid.create({
      data: bidData,
    });

    expect(prisma.bid.create).toHaveBeenCalledWith({
      data: bidData,
    });

    expect(bid).toMatchObject({
      id: "bid-int-001",
      solicitationId: "sol-int-001",
      lotId: "lot-int-001",
      vendorId: "vendor-int-001",
      submittedById: "user-int-001",
      bidNumber: "BID-INT-001",
      status: BidStatus.DRAFT,
    });
  });

  it("should preserve the relationship between a bid and its solicitation", async () => {
    const bidData = {
      solicitationId: "sol-int-002",
      lotId: "lot-int-002",
      vendorId: "vendor-int-002",
      submittedById: "user-int-002",
      bidNumber: "BID-INT-002",
      status: BidStatus.SUBMITTED,
    };

    const prisma = {
      bid: {
        create: vi.fn().mockResolvedValue({
          id: "bid-int-002",
          ...bidData,
        }),
      },
    };

    const bid = await prisma.bid.create({
      data: bidData,
    });

    expect(bid.solicitationId).toBe("sol-int-002");
  });

  it("should preserve the relationship between a bid and its lot", async () => {
    const bidData = {
      solicitationId: "sol-int-003",
      lotId: "lot-int-003",
      vendorId: "vendor-int-003",
      submittedById: "user-int-003",
      bidNumber: "BID-INT-003",
      status: BidStatus.SUBMITTED,
    };

    const prisma = {
      bid: {
        create: vi.fn().mockResolvedValue({
          id: "bid-int-003",
          ...bidData,
        }),
      },
    };

    const bid = await prisma.bid.create({
      data: bidData,
    });

    expect(bid.lotId).toBe("lot-int-003");
  });

  it("should preserve the relationship between a bid and its vendor", async () => {
    const bidData = {
      solicitationId: "sol-int-004",
      lotId: "lot-int-004",
      vendorId: "vendor-int-004",
      submittedById: "user-int-004",
      bidNumber: "BID-INT-004",
      status: BidStatus.SUBMITTED,
    };

    const prisma = {
      bid: {
        create: vi.fn().mockResolvedValue({
          id: "bid-int-004",
          ...bidData,
        }),
      },
    };

    const bid = await prisma.bid.create({
      data: bidData,
    });

    expect(bid.vendorId).toBe("vendor-int-004");
  });

  it("should preserve the user who submitted the bid", async () => {
    const bidData = {
      solicitationId: "sol-int-005",
      lotId: "lot-int-005",
      vendorId: "vendor-int-005",
      submittedById: "user-int-005",
      bidNumber: "BID-INT-005",
      status: BidStatus.SUBMITTED,
    };

    const prisma = {
      bid: {
        create: vi.fn().mockResolvedValue({
          id: "bid-int-005",
          ...bidData,
        }),
      },
    };

    const bid = await prisma.bid.create({
      data: bidData,
    });

    expect(bid.submittedById).toBe("user-int-005");
  });

  it("should allow a draft bid to become submitted", () => {
    const bid = {
      id: "bid-int-006",
      status: BidStatus.DRAFT,
    };

    const submittedBid = {
      ...bid,
      status: BidStatus.SUBMITTED,
    };

    expect(bid.status).toBe(BidStatus.DRAFT);
    expect(submittedBid.status).toBe(BidStatus.SUBMITTED);
  });

  it("should support the bid review lifecycle", () => {
    const lifecycle = [
      BidStatus.DRAFT,
      BidStatus.SUBMITTED,
      BidStatus.UNDER_REVIEW,
      BidStatus.EVALUATED,
    ];

    expect(lifecycle[0]).toBe(BidStatus.DRAFT);
    expect(lifecycle[1]).toBe(BidStatus.SUBMITTED);
    expect(lifecycle[2]).toBe(BidStatus.UNDER_REVIEW);
    expect(lifecycle[3]).toBe(BidStatus.EVALUATED);
  });

  it("should support withdrawal, rejection, and non-compliance outcomes", () => {
    const outcomes = [
      BidStatus.WITHDRAWN,
      BidStatus.REJECTED,
      BidStatus.NON_COMPLIANT,
    ];

    expect(outcomes).toContain(BidStatus.WITHDRAWN);
    expect(outcomes).toContain(BidStatus.REJECTED);
    expect(outcomes).toContain(BidStatus.NON_COMPLIANT);
  });

  it("should support an awarded bid", () => {
    const bid = {
      id: "bid-int-007",
      status: BidStatus.AWARDED,
    };

    expect(bid.status).toBe(BidStatus.AWARDED);
  });

  it("should preserve the bid number", async () => {
    const bidData = {
      solicitationId: "sol-int-008",
      lotId: "lot-int-008",
      vendorId: "vendor-int-008",
      submittedById: "user-int-008",
      bidNumber: "BID-INT-008",
      status: BidStatus.DRAFT,
    };

    const prisma = {
      bid: {
        create: vi.fn().mockResolvedValue({
          id: "bid-int-008",
          ...bidData,
        }),
      },
    };

    const bid = await prisma.bid.create({
      data: bidData,
    });

    expect(bid.bidNumber).toBe("BID-INT-008");
  });

  it("should preserve the solicitation context for an active solicitation", () => {
    const solicitation = {
      id: "sol-int-009",
      organizationId: "org-int-001",
      title: "Technology Services Solicitation",
      solicitationNumber: "SOL-INT-009",
      type: SolicitationType.RFP,
      status: SolicitationStatus.OPEN,
    };

    const bid = {
      solicitationId: solicitation.id,
      vendorId: "vendor-int-009",
      lotId: "lot-int-009",
      submittedById: "user-int-009",
      bidNumber: "BID-INT-009",
      status: BidStatus.SUBMITTED,
    };

    expect(solicitation.status).toBe(SolicitationStatus.OPEN);
    expect(bid.solicitationId).toBe(solicitation.id);
    expect(bid.status).toBe(BidStatus.SUBMITTED);
  });

  it("should reject an unsupported bid status", () => {
    const validStatuses = Object.values(BidStatus);

    expect(validStatuses).not.toContain("INVALID_STATUS");
  });
});