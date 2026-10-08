import { describe, expect, it } from "vitest";

import { BidStatus } from "@prisma/client";

describe("Bid locking", () => {
  const editableStatuses: BidStatus[] = [
    BidStatus.DRAFT,
  ];

  const lockedStatuses: BidStatus[] = [
    BidStatus.SUBMITTED,
    BidStatus.UNDER_REVIEW,
    BidStatus.EVALUATED,
    BidStatus.WITHDRAWN,
    BidStatus.REJECTED,
    BidStatus.AWARDED,
    BidStatus.NON_COMPLIANT,
  ];

  function isBidLocked(status: BidStatus): boolean {
    return !editableStatuses.includes(status);
  }

  it("should keep a draft bid editable", () => {
    expect(isBidLocked(BidStatus.DRAFT)).toBe(false);
  });

  it("should lock a submitted bid", () => {
    expect(isBidLocked(BidStatus.SUBMITTED)).toBe(true);
  });

  it("should lock a bid under review", () => {
    expect(isBidLocked(BidStatus.UNDER_REVIEW)).toBe(true);
  });

  it("should lock an evaluated bid", () => {
    expect(isBidLocked(BidStatus.EVALUATED)).toBe(true);
  });

  it("should lock a withdrawn bid", () => {
    expect(isBidLocked(BidStatus.WITHDRAWN)).toBe(true);
  });

  it("should lock a rejected bid", () => {
    expect(isBidLocked(BidStatus.REJECTED)).toBe(true);
  });

  it("should lock an awarded bid", () => {
    expect(isBidLocked(BidStatus.AWARDED)).toBe(true);
  });

  it("should lock a non-compliant bid", () => {
    expect(isBidLocked(BidStatus.NON_COMPLIANT)).toBe(true);
  });

  it("should only allow DRAFT bids to remain editable", () => {
    const allStatuses = Object.values(BidStatus);

    for (const status of allStatuses) {
      if (status === BidStatus.DRAFT) {
        expect(isBidLocked(status)).toBe(false);
      } else {
        expect(isBidLocked(status)).toBe(true);
      }
    }
  });

  it("should identify all non-draft statuses as locked", () => {
    for (const status of lockedStatuses) {
      expect(isBidLocked(status)).toBe(true);
    }
  });
});