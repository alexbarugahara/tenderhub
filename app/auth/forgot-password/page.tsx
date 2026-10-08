import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import Link from "next/link";

export const metadata = {
  title: "Forgot Password | TenderHub",
  description: "Reset your TenderHub account password.",
};

export default function ForgotPasswordPage() {
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
              Forgot your password?
            </h1>

            <p className="mt-3 text-gray-600">
              Enter your email address and we&apos;ll help you reset your
              password.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
            <ForgotPasswordForm />
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