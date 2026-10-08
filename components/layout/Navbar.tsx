"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useState } from "react";

import UserMenu from "./UserMenu";

export default function Navbar() {
  const { status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = status === "authenticated";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-tenderhub-navy text-sm font-bold text-tenderhub-gold">
            TH
          </span>

          <span className="text-lg font-bold tracking-tight text-tenderhub-navy">
            TenderHub
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          <Link
            href="/solicitations"
            className="text-sm font-medium text-gray-600 transition hover:text-tenderhub-navy"
          >
            Solicitations
          </Link>

          <Link
            href="/vendors"
            className="text-sm font-medium text-gray-600 transition hover:text-tenderhub-navy"
          >
            Vendors
          </Link>

          <Link
            href="/how-it-works"
            className="text-sm font-medium text-gray-600 transition hover:text-tenderhub-navy"
          >
            How It Works
          </Link>

          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-600 transition hover:text-tenderhub-navy"
          >
            Pricing
          </Link>
        </nav>

        {/* Desktop authentication */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-tenderhub-navy transition hover:bg-gray-100"
              >
                Sign In
              </Link>

              <Link
                href="/auth/register"
                className="rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-tenderhub-navy/90"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-tenderhub-navy hover:bg-gray-100 md:hidden"
        >
          {mobileOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile navigation */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-4 sm:px-6">
            <Link
              href="/solicitations"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-tenderhub-navy"
            >
              Solicitations
            </Link>

            <Link
              href="/vendors"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-tenderhub-navy"
            >
              Vendors
            </Link>

            <Link
              href="/how-it-works"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-tenderhub-navy"
            >
              How It Works
            </Link>

            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-tenderhub-navy"
            >
              Pricing
            </Link>

            {/* Mobile authentication */}
            <div className="mt-3 border-t border-gray-100 pt-3">
              {isAuthenticated ? (
                <div className="px-1">
                  <UserMenu />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-3 text-center text-sm font-semibold text-tenderhub-navy hover:bg-gray-100"
                  >
                    Sign In
                  </Link>

                  <Link
                    href="/auth/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-tenderhub-navy px-4 py-3 text-center text-sm font-semibold text-white"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}