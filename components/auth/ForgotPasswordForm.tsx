"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";

interface ForgotPasswordFormProps {
  className?: string;
}

export default function ForgotPasswordForm({
  className = "",
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ||
            data?.error ||
            "We could not process your request. Please try again.",
        );
        return;
      }

      setSuccess(
        data?.message ||
          "If an account exists with this email address, you will receive instructions to reset your password.",
      );
    } catch {
      setError(
        "Something went wrong while processing your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tenderhub-navy/5 text-tenderhub-navy">
          <Mail className="h-6 w-6" />
        </div>

        <h2 className="mt-5 text-center text-2xl font-bold text-tenderhub-navy">
          Forgot your password?
        </h2>

        <p className="mt-2 text-center text-sm leading-6 text-gray-500">
          Enter the email address associated with your TenderHub account and
          we&apos;ll send you instructions to reset your password.
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

      {success && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700"
        >
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="forgot-password-email"
            className="mb-2 block text-sm font-medium text-tenderhub-navy"
          >
            Email address
          </label>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="forgot-password-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-tenderhub-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Sending instructions...
            </>
          ) : (
            <>
              Send Reset Instructions
              <ArrowRight className="h-4 w-4" />
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