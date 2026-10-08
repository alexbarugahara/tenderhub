"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail, RefreshCw, ArrowLeft } from "lucide-react";

interface VerifyEmailProps {
  className?: string;
  email?: string;
  verified?: boolean;
}

export default function VerifyEmail({
  className = "",
  email = "",
  verified = false,
}: VerifyEmailProps) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const [isVerified, setIsVerified] = useState(verified);

  useEffect(() => {
    setIsVerified(verified);
  }, [verified]);

  async function handleResend() {
    if (!email.trim()) {
      setError("Please provide the email address associated with your account.");
      return;
    }

    setError("");
    setResent(false);
    setResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ||
            data?.error ||
            "We could not resend the verification email. Please try again.",
        );
        return;
      }

      setResent(true);
    } catch {
      setError(
        "Something went wrong while sending the verification email. Please try again.",
      );
    } finally {
      setResending(false);
    }
  }

  if (isVerified) {
    return (
      <div className={`w-full ${className}`}>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h2 className="mt-5 text-2xl font-bold text-tenderhub-navy">
            Email Verified
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Your email address has been successfully verified. You can now
            sign in to your TenderHub account.
          </p>

          <Link
            href="/auth/login"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-tenderhub-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-tenderhub-navy/90"
          >
            Continue to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-tenderhub-navy/5 text-tenderhub-navy">
          <Mail className="h-8 w-8" />
        </div>

        <h2 className="mt-5 text-2xl font-bold text-tenderhub-navy">
          Verify your email
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          We&apos;ve sent a verification link to
          {email ? (
            <>
              {" "}
              <span className="font-semibold text-tenderhub-navy">
                {email}
              </span>
            </>
          ) : (
            " your email address"
          )}
          .
        </p>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Open the email and click the verification link to activate your
          TenderHub account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
        >
          {error}
        </div>
      )}

      {resent && (
        <div
          role="status"
          className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700"
        >
          A new verification email has been sent. Please check your inbox.
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-tenderhub-navy">
          Didn&apos;t receive the email?
        </p>

        <ul className="mt-2 space-y-1 text-sm leading-6 text-gray-500">
          <li>• Check your spam or junk folder.</li>
          <li>• Make sure the email address is correct.</li>
          <li>• Wait a few minutes before requesting another email.</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || !email.trim()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-tenderhub-navy px-5 py-3 text-sm font-semibold text-tenderhub-navy transition hover:bg-tenderhub-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {resending ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Resend Verification Email
          </>
        )}
      </button>

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