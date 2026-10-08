"use client";

import { useCallback, useEffect, useState } from "react";

export type Evaluation = {
  id: string;
  status?: string;
  totalScore?: number | string;
};

type UseEvaluationOptions = {
  evaluationId?: string;
  enabled?: boolean;
};

export function useEvaluation({
  evaluationId,
  enabled = true,
}: UseEvaluationOptions = {}) {
  const [evaluation, setEvaluation] =
    useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(
    Boolean(enabled && evaluationId),
  );
  const [error, setError] = useState<string | null>(null);

  const fetchEvaluation = useCallback(async () => {
    if (!enabled || !evaluationId) {
      setEvaluation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/evaluations/${evaluationId}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load evaluation.");
      }

      const data = await response.json();
      setEvaluation(data.evaluation ?? data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load evaluation.",
      );
    } finally {
      setLoading(false);
    }
  }, [evaluationId, enabled]);

  useEffect(() => {
    void fetchEvaluation();
  }, [fetchEvaluation]);

  return {
    evaluation,
    loading,
    error,
    refetch: fetchEvaluation,
  };
}