import Link from "next/link";
import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-tenderhub-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-tenderhub-gold text-sm font-bold text-tenderhub-navy">
                TH
              </span>

              <span className="text-lg font-bold">TenderHub</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-300">
              A modern procurement platform connecting organizations with
              qualified vendors and simplifying the complete procurement
              lifecycle.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-tenderhub-gold">
              Platform
            </h3>

            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/solicitations"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Solicitations
              </Link>

              <Link
                href="/vendors"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Vendors
              </Link>

              <Link
                href="/pricing"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Pricing
              </Link>

              <Link
                href="/how-it-works"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                How It Works
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-tenderhub-gold">
              Organizations
            </h3>

            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/register?type=organization"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Create Organization
              </Link>

              <Link
                href="/solicitations/create"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Publish Solicitation
              </Link>

              <Link
                href="/pricing"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Organization Plans
              </Link>

              <Link
                href="/contact"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Contact Sales
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-tenderhub-gold">
              Vendors
            </h3>

            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/register?type=vendor"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Register as Vendor
              </Link>

              <Link
                href="/solicitations"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Find Opportunities
              </Link>

              <Link
                href="/pricing"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Vendor Plans
              </Link>

              <Link
                href="/contact"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                Support
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-400">
            © {currentYear} TenderHub. All rights reserved.
          </p>

          <div className="flex flex-wrap gap-5">
            <Link
              href="/privacy"
              className="text-sm text-gray-400 transition hover:text-white"
            >
              Privacy
            </Link>

            <Link
              href="/terms"
              className="text-sm text-gray-400 transition hover:text-white"
            >
              Terms
            </Link>

            <Link
              href="/contact"
              className="text-sm text-gray-400 transition hover:text-white"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}