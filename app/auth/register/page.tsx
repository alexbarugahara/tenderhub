"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserRole = "VENDOR" | "ORGANIZATION";

type OrganizationType =
  | "GOVERNMENT"
  | "LOCAL_GOVERNMENT"
  | "NGO"
  | "INTERNATIONAL_NGO"
  | "PRIVATE_COMPANY"
  | "SCHOOL_UNIVERSITY"
  | "HOSPITAL"
  | "BANK_FINANCIAL_INSTITUTION"
  | "DEVELOPMENT_AGENCY"
  | "OTHER";

const organizationTypes: {
  value: OrganizationType;
  label: string;
}[] = [
  {
    value: "GOVERNMENT",
    label: "Government",
  },
  {
    value: "LOCAL_GOVERNMENT",
    label: "Local Government",
  },
  {
    value: "NGO",
    label: "NGO",
  },
  {
    value: "INTERNATIONAL_NGO",
    label: "International NGO",
  },
  {
    value: "PRIVATE_COMPANY",
    label: "Private Company",
  },
  {
    value: "SCHOOL_UNIVERSITY",
    label: "School / University",
  },
  {
    value: "HOSPITAL",
    label: "Hospital",
  },
  {
    value: "BANK_FINANCIAL_INSTITUTION",
    label: "Bank / Financial Institution",
  },
  {
    value: "DEVELOPMENT_AGENCY",
    label: "Development Agency",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
    password: "",
    confirmPassword: "",
    role: "" as UserRole | "",
    organizationType: "" as OrganizationType | "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
    setMessage("");
  }

  function handleRoleChange(role: UserRole) {
    setFormData((previousData) => ({
      ...previousData,
      role,
      organizationType: "",
    }));

    setError("");
    setMessage("");
    setStep(2);
  }

  function handleContinueFromStepTwo() {
    setError("");
    setMessage("");

    if (
      formData.role === "ORGANIZATION" &&
      !formData.organizationType
    ) {
      setError("Please select your organization type.");
      return;
    }

    setStep(3);
  }

  function handleBack() {
    setError("");
    setMessage("");

    if (step > 1) {
      setStep(step - 1);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!formData.role) {
      setError(
        "Please select whether you are registering as a Vendor or Organization."
      );
      setStep(1);
      return;
    }

    if (
      formData.role === "ORGANIZATION" &&
      !formData.organizationType
    ) {
      setError("Please select your organization type.");
      setStep(2);
      return;
    }

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!formData.companyName.trim()) {
      setError(
        formData.role === "VENDOR"
          ? "Please enter your company name."
          : "Please enter your organization name."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role,
          companyName: formData.companyName.trim(),
          organizationType:
            formData.role === "ORGANIZATION"
              ? formData.organizationType
              : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            data.error ||
            "Registration failed. Please try again."
        );
        setLoading(false);
        return;
      }

      setMessage(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (registrationError) {
      console.error(
        "Registration error:",
        registrationError
      );

      setError(
        "Something went wrong while creating your account. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-tenderhub-background px-6 py-16">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-bold text-tenderhub-navy"
          >
            TenderHub
          </Link>

          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Create Account
          </h1>

          <p className="mt-2 text-gray-600">
            Create your TenderHub account and connect with
            procurement opportunities.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full font-semibold ${
              step >= 1
                ? "bg-tenderhub-navy text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            1
          </div>

          <div className="h-1 w-12 bg-gray-200">
            <div
              className={`h-full ${
                step >= 2
                  ? "bg-tenderhub-gold"
                  : "bg-gray-200"
              }`}
            />
          </div>

          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full font-semibold ${
              step >= 2
                ? "bg-tenderhub-navy text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            2
          </div>

          <div className="h-1 w-12 bg-gray-200">
            <div
              className={`h-full ${
                step >= 3
                  ? "bg-tenderhub-gold"
                  : "bg-gray-200"
              }`}
            />
          </div>

          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full font-semibold ${
              step >= 3
                ? "bg-tenderhub-navy text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            3
          </div>
        </div>

        <div className="mb-6 text-center">
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900">
                Choose Account Type
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Tell us how you will use TenderHub.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900">
                {formData.role === "VENDOR"
                  ? "Vendor Registration"
                  : "Choose Organization Type"}
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Tell us a little about your business or
                organization.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold text-gray-900">
                Enter Your Details
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Complete your registration.
              </p>
            </>
          )}
        </div>

        {message && (
          <div className="mb-5 rounded-lg bg-green-100 p-3 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <label className="block font-medium text-gray-900">
              I want to register as:
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  handleRoleChange("VENDOR")
                }
                className={`rounded-xl border-2 p-5 text-left transition ${
                  formData.role === "VENDOR"
                    ? "border-tenderhub-gold bg-gray-50"
                    : "border-gray-200 hover:border-tenderhub-gold hover:bg-gray-50"
                }`}
              >
                <div className="mb-3 text-3xl">
                  🏢
                </div>

                <h3 className="font-semibold text-gray-900">
                  Vendor
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  Find procurement opportunities, submit
                  bids, upload documents, and manage
                  contracts.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleRoleChange("ORGANIZATION")
                }
                className={`rounded-xl border-2 p-5 text-left transition ${
                  formData.role === "ORGANIZATION"
                    ? "border-tenderhub-gold bg-gray-50"
                    : "border-gray-200 hover:border-tenderhub-gold hover:bg-gray-50"
                }`}
              >
                <div className="mb-3 text-3xl">
                  🏛️
                </div>

                <h3 className="font-semibold text-gray-900">
                  Organization
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  Create procurements, publish solicitations,
                  evaluate bids, and manage awards and
                  contracts.
                </p>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {formData.role === "VENDOR" && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="font-semibold text-gray-900">
                  Vendor Account
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Your vendor profile will contain your
                  company information, procurement
                  classifications, documents, compliance
                  records, bids, awards, and contracts.
                </p>

                <p className="mt-3 text-sm font-medium text-tenderhub-navy">
                  You will provide your company name in
                  the next step.
                </p>
              </div>
            )}

            {formData.role === "ORGANIZATION" && (
              <div>
                <label
                  htmlFor="organizationType"
                  className="mb-2 block font-medium text-gray-900"
                >
                  Organization Type
                </label>

                <select
                  id="organizationType"
                  name="organizationType"
                  value={formData.organizationType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 outline-none focus:border-tenderhub-navy focus:ring-2 focus:ring-gray-100"
                >
                  <option value="">
                    Select organization type
                  </option>

                  {organizationTypes.map((type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="w-1/3 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleContinueFromStepTwo}
                className="w-2/3 rounded-lg bg-tenderhub-navy py-3 font-semibold text-white transition hover:opacity-90"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="name"
                className="mb-2 block font-medium text-gray-900"
              >
                Full Name
              </label>

              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="name"
                placeholder="John Doe"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-tenderhub-navy focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block font-medium text-gray-900"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-tenderhub-navy focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="companyName"
                className="mb-2 block font-medium text-gray-900"
              >
                {formData.role === "VENDOR"
                  ? "Company Name"
                  : "Organization Name"}
              </label>

              <input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                autoComplete="organization"
                placeholder={
                  formData.role === "VENDOR"
                    ? "ABC Technologies Ltd"
                    : "Example Organization"
                }
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-tenderhub-navy focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-medium text-gray-900"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Create password"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-tenderhub-navy focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block font-medium text-gray-900"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Confirm password"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-tenderhub-navy focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="w-1/3 rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-2/3 rounded-lg bg-tenderhub-navy py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-gray-600">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-tenderhub-navy hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}