import Link from "next/link";
import { Suspense } from "react";

import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login | TenderHub",
  description: "Sign in to your TenderHub account.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-tenderhub-background px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center justify-center">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="inline-block text-2xl font-bold text-tenderhub-navy transition-opacity hover:opacity-80"
            >
              TenderHub
            </Link>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>

            <p className="mt-3 text-gray-600">
              Sign in to your TenderHub account.
            </p>
          </div>

          {/* Login form */}
          <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
            <Suspense
              fallback={
                <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-500">
                  Loading login form...
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </div>

          {/* Registration link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <span>Don&apos;t have an account? </span>

            <Link
              href="/auth/register"
              className="font-semibold text-tenderhub-navy hover:underline"
            >
              Create an account
            </Link>
          </div>

          {/* Home link */}
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