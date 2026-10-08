"use client";

import Link from "next/link";

type Requirement = {
  title: string;
  description: string;
  evidence: string[];
  verification: string;
  required: boolean;
};

const REQUIREMENTS: Requirement[] = [
  {
    title: "Legal business identity",
    description:
      "TenderHub needs to establish the legal identity of the organization applying for verification.",
    evidence: [
      "Certificate of incorporation, formation, registration, or equivalent government document",
      "Legal business name",
      "Organization type",
    ],
    verification:
      "TenderHub administrators compare the organization information with the submitted registration evidence.",
    required: true,
  },
  {
    title: "Business registration",
    description:
      "The organization must provide evidence showing that it is legally registered or established.",
    evidence: [
      "Business registration certificate",
      "Certificate of incorporation",
      "Certificate of formation",
      "Government registration document",
      "Registration number",
    ],
    verification:
      "The registration details are reviewed against the submitted registration documentation and applicable records.",
    required: true,
  },
  {
    title: "Tax identification",
    description:
      "Where applicable, TenderHub may require information identifying the organization for tax purposes.",
    evidence: [
      "Tax identification document",
      "Tax registration certificate",
      "Tax clearance document where applicable",
    ],
    verification:
      "Tax identification information is reviewed for consistency with the organization's legal identity.",
    required: false,
  },
  {
    title: "Business address",
    description:
      "TenderHub needs a verifiable business or registered address for the organization.",
    evidence: [
      "Registered business address",
      "Proof of business address",
      "Government or official correspondence showing the address",
    ],
    verification:
      "The address supplied by the organization is compared with supporting evidence.",
    required: true,
  },
  {
    title: "Authorized representative",
    description:
      "The person submitting the verification application must be authorized to represent the organization.",
    evidence: [
      "Authorized representative identification",
      "Authorization letter where applicable",
      "Evidence of the representative's relationship with the organization",
    ],
    verification:
      "TenderHub administrators review the representative information and supporting evidence.",
    required: true,
  },
  {
    title: "Ownership and control",
    description:
      "Ownership or control information may be requested where necessary for compliance or risk review.",
    evidence: [
      "Ownership information",
      "Beneficial ownership information",
      "Corporate ownership records where applicable",
    ],
    verification:
      "Submitted ownership or control information may be reviewed as part of the organization's compliance assessment.",
    required: false,
  },
  {
    title: "Business or professional licensing",
    description:
      "Some organizations may require specific licences or permits to operate or provide particular services.",
    evidence: [
      "Business licence",
      "Professional licence",
      "Sector-specific permit",
      "Other applicable regulatory licence",
    ],
    verification:
      "Applicable licences may be reviewed for validity, consistency and relevance to the organization.",
    required: false,
  },
  {
    title: "Government contracting information",
    description:
      "Organizations seeking certain government or federal contracting opportunities may need additional information.",
    evidence: [
      "UEI documentation where applicable",
      "SAM registration where applicable",
      "Other government registration information",
    ],
    verification:
      "Additional government contracting information may be reviewed when relevant to the organization's activities.",
    required: false,
  },
];

function RequirementCard({
  requirement,
}: {
  requirement: Requirement;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {requirement.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {requirement.description}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            requirement.required
              ? "bg-red-50 text-red-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {requirement.required ? "Required" : "Conditional"}
        </span>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Evidence you may need
          </h3>

          <ul className="mt-3 space-y-2">
            {requirement.evidence.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm leading-5 text-slate-600"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-900">
            How TenderHub verifies it
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {requirement.verification}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerificationRequirementsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link
              href="/dashboard/organization"
              className="hover:text-slate-900"
            >
              Organization
            </Link>

            <span>/</span>

            <span className="text-slate-700">
              Verification & Compliance
            </span>
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Verification Requirements
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Before your organization can be verified, TenderHub needs to
              establish its legal identity, registration details and other
              applicable compliance information.
            </p>
          </div>
        </div>

        {/* Step navigation */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-[#071A33] p-4 text-white">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Step 1
              </div>

              <div className="mt-1 font-semibold">
                Verification Requirements
              </div>

              <div className="mt-1 text-xs text-slate-300">
                Understand what TenderHub needs.
              </div>
            </div>

            <Link
              href="/dashboard/organization/verification/administrator-checks"
              className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step 2
              </div>

              <div className="mt-1 font-semibold text-slate-900">
                Administrator Verification Checks
              </div>

              <div className="mt-1 text-xs text-slate-500">
                See what TenderHub administrators will review.
              </div>
            </Link>

            <Link
              href="/dashboard/organization/verification/documents"
              className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step 3
              </div>

              <div className="mt-1 font-semibold text-slate-900">
                Supporting Documents
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Submit your information and evidence.
              </div>
            </Link>
          </div>
        </div>

        {/* Intro */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-900">
            What this page is for
          </h2>

          <p className="mt-2 text-sm leading-6 text-blue-800">
            This page explains the information and evidence TenderHub may
            require. You do not need to perform the administrator checks
            yourself. The actual submission of documents happens on the final
            step.
          </p>
        </div>

        {/* Requirements */}
        <div className="mt-8 space-y-5">
          {REQUIREMENTS.map((requirement) => (
            <RequirementCard
              key={requirement.title}
              requirement={requirement}
            />
          ))}
        </div>

        {/* Important distinction */}
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Important: evidence is not the same as verification
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            When you upload a document, TenderHub will record that evidence has
            been received for the applicable requirement. The requirement
            remains <strong>Pending verification</strong> until an authorized
            TenderHub administrator reviews the evidence.
          </p>
        </div>

        {/* Continue */}
        <div className="mt-8 flex justify-end">
          <Link
            href="/dashboard/organization/verification/administrator-checks"
            className="inline-flex items-center rounded-lg bg-[#071A33] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Continue to Administrator Checks
            <span className="ml-2">→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}