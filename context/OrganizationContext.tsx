"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Organization = {
  id: string;
  name?: string;
  legalName?: string;
  slug?: string;
};

type OrganizationContextValue = {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  setOrganization: (organization: Organization | null) => void;
  refreshOrganization: () => Promise<void>;
};

const OrganizationContext =
  createContext<OrganizationContextValue | undefined>(
    undefined,
  );

type OrganizationProviderProps = {
  children: ReactNode;
  organizationId?: string;
};

export function OrganizationProvider({
  children,
  organizationId,
}: OrganizationProviderProps) {
  const [organization, setOrganization] =
    useState<Organization | null>(null);
  const [loading, setLoading] = useState(
    Boolean(organizationId),
  );
  const [error, setError] = useState<string | null>(null);

  const refreshOrganization = useCallback(async () => {
    if (!organizationId) {
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
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load organization.",
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void refreshOrganization();
  }, [refreshOrganization]);

  const value = useMemo(
    () => ({
      organization,
      loading,
      error,
      setOrganization,
      refreshOrganization,
    }),
    [organization, loading, error, refreshOrganization],
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error(
      "useOrganizationContext must be used within an OrganizationProvider.",
    );
  }

  return context;
}