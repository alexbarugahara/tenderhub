"use client";

import { useCallback, useEffect, useState } from "react";

export type Solicitation = {
  id: string;
  solicitationNumber?: string;
  title?: string;
  description?: string;
  status?: string;
};

type UseSolicitationOptions = {
  solicitationId?: string;
  enabled?: boolean;
};

export function useSolicitation({
  solicitationId,
  enabled = true,
}: UseSolicitationOptions = {}) {
  const [solicitation, setSolicitation] =
    useState<Solicitation | null>(null);
  const [loading, setLoading] = useState(
    Boolean(enabled && solicitationId),
  );
  const [error, setError] = useState<string | null>(null);

  const fetchSolicitation = useCallback(async () => {
    if (!enabled || !solicitationId) {
      setSolicitation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/solicitations/${solicitationId}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load solicitation.");
      }

      const data = await response.json();
      setSolicitation(data.solicitation ?? data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load solicitation.",
      );
    } finally {
      setLoading(false);
    }
  }, [solicitationId, enabled]);

  useEffect(() => {
    void fetchSolicitation();
  }, [fetchSolicitation]);

  return {
    solicitation,
    loading,
    error,
    refetch: fetchSolicitation,
  };
}