import { describe, expect, it } from "vitest";

type EvaluationResult = {
  bidId: string;
  score: number;
};

function rankEvaluations(
  evaluations: EvaluationResult[],
): EvaluationResult[] {
  return [...evaluations].sort((a, b) => b.score - a.score);
}

describe("Evaluation ranking", () => {
  it("should rank bids from highest score to lowest score", () => {
    const evaluations = [
      { bidId: "bid-001", score: 72 },
      { bidId: "bid-002", score: 91 },
      { bidId: "bid-003", score: 84 },
    ];

    const ranked = rankEvaluations(evaluations);

    expect(ranked).toEqual([
      { bidId: "bid-002", score: 91 },
      { bidId: "bid-003", score: 84 },
      { bidId: "bid-001", score: 72 },
    ]);
  });

  it("should place the highest-scoring bid first", () => {
    const evaluations = [
      { bidId: "bid-001", score: 65 },
      { bidId: "bid-002", score: 95 },
      { bidId: "bid-003", score: 80 },
    ];

    const ranked = rankEvaluations(evaluations);

    expect(ranked[0]).toEqual({
      bidId: "bid-002",
      score: 95,
    });
  });

  it("should place the lowest-scoring bid last", () => {
    const evaluations = [
      { bidId: "bid-001", score: 65 },
      { bidId: "bid-002", score: 95 },
      { bidId: "bid-003", score: 80 },
    ];

    const ranked = rankEvaluations(evaluations);

    expect(ranked[ranked.length - 1]).toEqual({
      bidId: "bid-001",
      score: 65,
    });
  });

  it("should preserve all bids when ranking", () => {
    const evaluations = [
      { bidId: "bid-001", score: 70 },
      { bidId: "bid-002", score: 85 },
      { bidId: "bid-003", score: 90 },
      { bidId: "bid-004", score: 75 },
    ];

    const ranked = rankEvaluations(evaluations);

    expect(ranked).toHaveLength(evaluations.length);
    expect(ranked.map((evaluation) => evaluation.bidId)).toEqual([
      "bid-003",
      "bid-002",
      "bid-004",
      "bid-001",
    ]);
  });

  it("should handle a single bid", () => {
    const evaluations = [
      { bidId: "bid-001", score: 88 },
    ];

    expect(rankEvaluations(evaluations)).toEqual([
      { bidId: "bid-001", score: 88 },
    ]);
  });

  it("should return an empty array when there are no evaluations", () => {
    expect(rankEvaluations([])).toEqual([]);
  });

  it("should handle tied scores", () => {
    const evaluations = [
      { bidId: "bid-001", score: 85 },
      { bidId: "bid-002", score: 85 },
      { bidId: "bid-003", score: 75 },
    ];

    const ranked = rankEvaluations(evaluations);

    expect(ranked).toHaveLength(3);
    expect(ranked[0].score).toBe(85);
    expect(ranked[1].score).toBe(85);
    expect(ranked[2].score).toBe(75);
  });

  it("should correctly rank decimal scores", () => {
    const evaluations = [
      { bidId: "bid-001", score: 81.25 },
      { bidId: "bid-002", score: 81.75 },
      { bidId: "bid-003", score: 80.5 },
    ];

    const ranked = rankEvaluations(evaluations);

    expect(ranked).toEqual([
      { bidId: "bid-002", score: 81.75 },
      { bidId: "bid-001", score: 81.25 },
      { bidId: "bid-003", score: 80.5 },
    ]);
  });

  it("should not mutate the original evaluations array", () => {
    const evaluations = [
      { bidId: "bid-001", score: 70 },
      { bidId: "bid-002", score: 90 },
      { bidId: "bid-003", score: 80 },
    ];

    const original = [...evaluations];

    rankEvaluations(evaluations);

    expect(evaluations).toEqual(original);
  });

  it("should maintain descending score order", () => {
    const evaluations = [
      { bidId: "bid-001", score: 55 },
      { bidId: "bid-002", score: 92 },
      { bidId: "bid-003", score: 68 },
      { bidId: "bid-004", score: 84 },
      { bidId: "bid-005", score: 77 },
    ];

    const ranked = rankEvaluations(evaluations);

    for (let index = 1; index < ranked.length; index++) {
      expect(ranked[index - 1].score).toBeGreaterThanOrEqual(
        ranked[index].score,
      );
    }
  });
});