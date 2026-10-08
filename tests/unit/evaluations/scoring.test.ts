import { describe, expect, it } from "vitest";

type CriterionScore = {
  weight: number;
  score: number;
};

function calculateWeightedScore(criteria: CriterionScore[]): number {
  return criteria.reduce(
    (total, criterion) =>
      total + criterion.weight * criterion.score,
    0,
  );
}

describe("Evaluation scoring", () => {
  it("should calculate a weighted score correctly", () => {
    const criteria = [
      { weight: 0.4, score: 80 },
      { weight: 0.3, score: 70 },
      { weight: 0.2, score: 90 },
      { weight: 0.1, score: 60 },
    ];

    const score = calculateWeightedScore(criteria);

    expect(score).toBe(77);
  });

  it("should calculate a perfect score when every criterion receives full marks", () => {
    const criteria = [
      { weight: 0.5, score: 100 },
      { weight: 0.3, score: 100 },
      { weight: 0.2, score: 100 },
    ];

    expect(calculateWeightedScore(criteria)).toBe(100);
  });

  it("should return zero when all criterion scores are zero", () => {
    const criteria = [
      { weight: 0.5, score: 0 },
      { weight: 0.3, score: 0 },
      { weight: 0.2, score: 0 },
    ];

    expect(calculateWeightedScore(criteria)).toBe(0);
  });

  it("should respect different criterion weights", () => {
    const criteria = [
      { weight: 0.7, score: 90 },
      { weight: 0.2, score: 50 },
      { weight: 0.1, score: 20 },
    ];

    const score = calculateWeightedScore(criteria);

    expect(score).toBe(75);
  });

  it("should handle a single evaluation criterion", () => {
    const criteria = [
      { weight: 1, score: 85 },
    ];

    expect(calculateWeightedScore(criteria)).toBe(85);
  });

  it("should return zero when there are no criteria", () => {
    expect(calculateWeightedScore([])).toBe(0);
  });

  it("should produce a score between zero and one hundred for valid inputs", () => {
    const criteria = [
      { weight: 0.4, score: 75 },
      { weight: 0.35, score: 80 },
      { weight: 0.25, score: 90 },
    ];

    const score = calculateWeightedScore(criteria);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("should preserve decimal weighted scores", () => {
    const criteria = [
      { weight: 0.5, score: 83 },
      { weight: 0.3, score: 77 },
      { weight: 0.2, score: 91 },
    ];

    const score = calculateWeightedScore(criteria);

    expect(score).toBeCloseTo(82.4, 5);
  });

  it("should calculate the score independently for each criterion", () => {
    const firstCriteria = [
      { weight: 0.6, score: 80 },
      { weight: 0.4, score: 60 },
    ];

    const secondCriteria = [
      { weight: 0.6, score: 60 },
      { weight: 0.4, score: 80 },
    ];

    expect(calculateWeightedScore(firstCriteria)).toBe(72);
    expect(calculateWeightedScore(secondCriteria)).toBe(68);
  });

  it("should use weights that sum to one for a normalized score", () => {
    const criteria = [
      { weight: 0.4, score: 80 },
      { weight: 0.35, score: 70 },
      { weight: 0.25, score: 90 },
    ];

    const totalWeight = criteria.reduce(
      (total, criterion) => total + criterion.weight,
      0,
    );

    expect(totalWeight).toBeCloseTo(1, 5);

    const score = calculateWeightedScore(criteria);

    expect(score).toBeCloseTo(78.5, 5);
  });
});