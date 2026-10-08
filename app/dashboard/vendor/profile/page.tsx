import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <User className="mx-auto h-12 w-12 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Sign In Required
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                You must be signed in to view your vendor profile.
              </p>

              <Link
                href="/dashboard/vendor"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      vendor: {
        select: {
          id: true,
          companyName: true,
          legalName: true,
          registrationNumber: true,
          taxNumber: true,
          website: true,
          address: true,
          description: true,
          country: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          verifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user?.vendor) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <Building2 className="mx-auto h-12 w-12 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Profile Not Found
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Your account is not currently associated with a vendor
                profile. Contact the TenderHub administrator if you believe
                this is incorrect.
              </p>

              <Link
                href="/dashboard/vendor"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const vendor = user.vendor;

  const formatDate = (date: Date | null | undefined) => {
    if (!date) {
      return "Not available";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const locationParts = [vendor.address, vendor.country?.name].filter(
    Boolean,
  );

  const profileFields = [
    {
      label: "Company Name",
      value: vendor.companyName,
      icon: Building2,
    },
    {
      label: "Legal Name",
      value: vendor.legalName || "Not provided",
      icon: Building2,
    },
    {
      label: "Registration Number",
      value: vendor.registrationNumber || "Not provided",
      icon: ShieldCheck,
    },
    {
      label: "Tax Number",
      value: vendor.taxNumber || "Not provided",
      icon: ShieldCheck,
    },
    {
      label: "Website",
      value: vendor.website || "Not provided",
      icon: Building2,
    },
  ];

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/dashboard/vendor"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-tenderhub-navy"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Vendor Portal
                </p>

                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Vendor Profile
                </h1>
              </div>
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              View the company and account information associated with your
              TenderHub vendor profile.
            </p>
          </div>

          <Link
            href="/dashboard/vendor/settings"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Profile Settings
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Building2 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Company Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Information associated with your vendor organization.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">
              {profileFields.map((field) => {
                const Icon = field.icon;

                return (
                  <div key={field.label}>
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      <Icon className="h-4 w-4" />
                      {field.label}
                    </div>

                    <p className="mt-2 break-words text-sm font-medium text-slate-900">
                      {field.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {vendor.description && (
              <div className="border-t border-slate-200 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Business Description
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {vendor.description}
                </p>
              </div>
            )}
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tenderhub-navy text-white">
                <Building2 className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                {vendor.companyName}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Vendor ID: {vendor.id}
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Vendor Since
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {formatDate(vendor.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      vendor.verifiedAt
                        ? "text-green-600"
                        : "text-slate-400"
                    }`}
                  />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Profile Status
                    </p>

                    <p
                      className={`mt-1 text-sm font-medium ${
                        vendor.verifiedAt
                          ? "text-green-700"
                          : "text-amber-700"
                      }`}
                    >
                      {vendor.verifiedAt
                        ? "Verified"
                        : "Pending Verification"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <User className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Account Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    User account connected to this vendor profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Name
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {user.name || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-slate-900">
                    {user.email}
                  </p>

                  {user.emailVerified && (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Email verified
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Phone
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {user.phone || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Account Created
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Business Location
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Registered vendor business location.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {locationParts.length > 0 ? (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-tenderhub-gold" />

                  <div className="space-y-1">
                    {locationParts.map((part, index) => (
                      <p
                        key={`${part}-${index}`}
                        className="text-sm text-slate-700"
                      >
                        {part}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                  <MapPin className="mx-auto h-8 w-8 text-slate-300" />

                  <p className="mt-3 text-sm font-medium text-slate-700">
                    No business location provided
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Add your business address through your vendor profile
                    settings.
                  </p>
                </div>
              )}

              {vendor.country && (
                <div className="mt-6 rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Country
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {vendor.country.name}
                  </p>

                  {vendor.country.code && (
                    <p className="mt-1 text-xs text-slate-500">
                      {vendor.country.code}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900">
              Profile Activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recent timestamps associated with your vendor profile.
            </p>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Created
              </p>

              <p className="mt-2 text-sm font-medium text-slate-900">
                {formatDate(vendor.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Last Updated
              </p>

              <p className="mt-2 text-sm font-medium text-slate-900">
                {formatDate(vendor.updatedAt)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}