import Link from "next/link";
import { Suspense } from "react";

import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Reset Password | TenderHub",
  description: "Create a new password for your TenderHub account.",
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-tenderhub-background px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center justify-center">
        <div className="w-full">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="inline-block text-2xl font-bold text-tenderhub-navy transition-opacity hover:opacity-80"
            >
              TenderHub
            </Link>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Reset your password
            </h1>

            <p className="mt-3 text-gray-600">
              Create a new password for your TenderHub account.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
            <Suspense
              fallback={
                <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500">
                  Loading password reset form...
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <span>Remember your password? </span>

            <Link
              href="/auth/login"
              className="font-semibold text-tenderhub-navy hover:underline"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-gray-500 transition-colors hover:text-tenderhub-navy hover:underline"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
