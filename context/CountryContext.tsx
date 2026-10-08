"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Country = {
  code: string;
  name: string;
};

export const DEFAULT_COUNTRY: Country = {
  code: "UG",
  name: "Uganda",
};

type CountryContextValue = {
  country: Country;
  setCountry: (country: Country) => void;
};

const CountryContext =
  createContext<CountryContextValue | undefined>(
    undefined,
  );

type CountryProviderProps = {
  children: ReactNode;
  initialCountry?: Country;
};

export function CountryProvider({
  children,
  initialCountry = DEFAULT_COUNTRY,
}: CountryProviderProps) {
  const [country, setCountry] =
    useState<Country>(initialCountry);

  const value = useMemo(
    () => ({
      country,
      setCountry,
    }),
    [country],
  );

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountryContext() {
  const context = useContext(CountryContext);

  if (!context) {
    throw new Error(
      "useCountryContext must be used within a CountryProvider.",
    );
  }

  return context;
}