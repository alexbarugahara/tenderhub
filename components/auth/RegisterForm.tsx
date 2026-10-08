"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  Store,
  User,
} from "lucide-react";

type RegisterRole = "ORGANIZATION" | "VENDOR";

interface RegisterFormProps {
  className?: string;
  defaultRole?: RegisterRole;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: RegisterRole;
}

export default function RegisterForm({
  className = "",
  defaultRole = "VENDOR",
}: RegisterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleFromUrl = searchParams.get("role");

  const initialRole: RegisterRole =
    roleFromUrl === "ORGANIZATION" || roleFromUrl === "VENDOR"
      ? roleFromUrl
      : defaultRole;

  const callbackUrl = searchParams.get("callbackUrl");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [role, setRole] = useState<RegisterRole>(initialRole);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (!normalizedName) {
      setError("Please enter your full name.");
      return;
    }

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!normalizedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    const payload: RegisterPayload = {
      name: normalizedName,
      email: normalizedEmail,
      password,
      role,
    };

    if (normalizedPhone) {
      payload.phone = normalizedPhone;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ||
            data?.error ||
            "Unable to create your account. Please try again.",
        );
        return;
      }

      setSuccess(
        "Your account has been created successfully. Signing you in...",
      );

      const signInResponse = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          email: normalizedEmail,
          password,
          redirect: "false",
          callbackUrl: callbackUrl || "/dashboard",
        }).toString(),
      });

      if (signInResponse.ok) {
        router.push(callbackUrl || "/dashboard");
        router.refresh();
        return;
      }

      router.push("/auth/login");
      router.refresh();
    } catch {
      setError(
        "Something went wrong while creating your account. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700"
          >
            {success}
          </div>
        )}

        <div>
          <label className="mb-3 block text-sm font-medium text-tenderhub-navy">
            Account type
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setRole("VENDOR")}
              disabled={submitting}
              className={`rounded-xl border p-4 text-left transition ${
                role === "VENDOR"
                  ? "border-tenderhub-gold bg-tenderhub-gold/10 ring-2 ring-tenderhub-gold/20"
                  : "border-gray-200 bg-white hover:border-gray-300"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tenderhub-navy/5 text-tenderhub-navy">
                  <Store className="h-5 w-5" />
                </div>

                {role === "VENDOR" && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-tenderhub-gold text-tenderhub-navy">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>

              <h3 className="mt-3 text-sm font-semibold text-tenderhub-navy">
                Vendor
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Find opportunities, manage your bids, documents, and
                compliance.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole("ORGANIZATION")}
              disabled={submitting}
              className={`rounded-xl border p-4 text-left transition ${
                role === "ORGANIZATION"
                  ? "border-tenderhub-gold bg-tenderhub-gold/10 ring-2 ring-tenderhub-gold/20"
                  : "border-gray-200 bg-white hover:border-gray-300"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tenderhub-navy/5 text-tenderhub-navy">
                  <Building2 className="h-5 w-5" />
                </div>

                {role === "ORGANIZATION" && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-tenderhub-gold text-tenderhub-navy">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>

              <h3 className="mt-3 text-sm font-semibold text-tenderhub-navy">
                Organization
              </h3>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                Create solicitations, evaluate bids, manage awards and
                contracts.
              </p>
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-tenderhub-navy"
          >
            Full name
          </label>

          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-tenderhub-navy"
          >
            Email address
          </label>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="email"
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

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-tenderhub-navy"
          >
            Phone number
            <span className="ml-1 font-normal text-gray-400">(optional)</span>
          </label>

          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+256 700 000 000"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-tenderhub-navy"
          >
            Password
          </label>

          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-50"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              disabled={submitting}
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:text-tenderhub-navy disabled:cursor-not-allowed"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-2 block text-sm font-medium text-tenderhub-navy"
          >
            Confirm password
          </label>

          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Enter your password again"
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
                  ? "Hide confirmation password"
                  : "Show confirmation password"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:text-tenderhub-navy disabled:cursor-not-allowed"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs leading-5 text-gray-500">
            By creating an account, you agree to use TenderHub for legitimate
            procurement activities and provide accurate account information.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-tenderhub-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-tenderhub-navy transition hover:text-tenderhub-gold"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}