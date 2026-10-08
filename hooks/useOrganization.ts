"use client";

import { useCallback, useEffect, useState } from "react";

export type Organization = {
  id: string;
  name?: string;
  legalName?: string;
  slug?: string;
};

type UseOrganizationOptions = {
  organizationId?: string;
  enabled?: boolean;
};

export function useOrganization({
  organizationId,
  enabled = true,
}: UseOrganizationOptions = {}) {
  const [organization, setOrganization] =
    useState<Organization | null>(null);
  const [loading, setLoading] = useState(
    Boolean(enabled && organizationId),
  );
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    if (!enabled || !organizationId) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load organization.");
      }

      const data = await response.json();

      setOrganization(data.organization ?? data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load organization.",
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId, enabled]);

  useEffect(() => {
    void fetchOrganization();
  }, [fetchOrganization]);

  return {
    organization,
    loading,
    error,
    refetch: fetchOrganization,
  };
}