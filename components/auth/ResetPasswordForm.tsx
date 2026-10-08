"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

interface ResetPasswordFormProps {
  className?: string;
}

export default function ResetPasswordForm({
  className = "",
}: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError(
        "This password reset link is invalid or incomplete. Please request a new reset link.",
      );
      return;
    }

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ||
            data?.error ||
            "We could not reset your password. The link may have expired.",
        );
        return;
      }

      setSuccess(true);

      window.setTimeout(() => {
        router.push("/auth/login");
        router.refresh();
      }, 2000);
    } catch {
      setError(
        "Something went wrong while resetting your password. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={`w-full ${className}`}>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-2xl font-bold text-tenderhub-navy">
            Password Reset Successful
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Your password has been changed successfully. You will be
            redirected to the sign-in page shortly.
          </p>

          <Link
            href="/auth/login"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-tenderhub-navy/90"
          >
            Continue to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tenderhub-navy/5 text-tenderhub-navy">
          <Lock className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-center text-2xl font-bold text-tenderhub-navy">
          Reset your password
        </h2>

        <p className="mt-2 text-center text-sm leading-6 text-gray-500">
          Choose a new password for your TenderHub account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
        >
          {error}
        </div>
      )}

      {!token && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-700">
          This page requires a valid password reset link. Please request a new
          reset link if you reached this page directly.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="reset-password"
            className="mb-2 block text-sm font-medium text-tenderhub-navy"
          >
            New password
          </label>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="reset-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your new password"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-50"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={submitting}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-tenderhub-navy disabled:cursor-not-allowed"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Use at least 8 characters.
          </p>
        </div>

        <div>
          <label
            htmlFor="reset-confirm-password"
            className="mb-2 block text-sm font-medium text-tenderhub-navy"
          >
            Confirm new password
          </label>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="reset-confirm-password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm your new password"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-50"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((current) => !current)
              }
              disabled={submitting}
              aria-label={
                showConfirmPassword
                  ? "Hide password confirmation"
                  : "Show password confirmation"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-tenderhub-navy disabled:cursor-not-allowed"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !token}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-tenderhub-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Resetting Password...
            </>
          ) : (
            <>
              Reset Password
              <Lock className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-tenderhub-navy transition hover:text-tenderhub-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}