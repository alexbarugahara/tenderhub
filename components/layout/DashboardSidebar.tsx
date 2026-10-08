"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { useSession } from "next-auth/react";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

function DashboardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ProcurementIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function SolicitationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 3v5h5M8 12h8M8 16h6"
      />
    </svg>
  );
}

function BidIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M4 12h10M4 17h16"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 10v8m0 0-3-3m3 3 3-3"
      />
    </svg>
  );
}

function EvaluationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 20V10M12 20V4M19 20v-7"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 20h18"
      />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 11-2 10 5-3 5 3-2-10"
      />
    </svg>
  );
}

function ContractIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 3v5h5M8 12h8M8 16h5"
      />
    </svg>
  );
}

function VendorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1"
      />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function OrganizationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"
      />
    </svg>
  );
}

function VerificationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3 5 6v5c0 4.7 2.9 8.6 7 10 4.1-1.4 7-5.3 7-10V6l-7-3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m9 12 2 2 4-4"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-2.6h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.5 1Z"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 21h4"
      />
    </svg>
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role;

  const commonSections: SidebarSection[] = [
    {
      title: "Workspace",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: <DashboardIcon />,
        },
        {
          label: "Notifications",
          href: "/dashboard/notifications",
          icon: <BellIcon />,
        },
      ],
    },
  ];

  const organizationSections: SidebarSection[] = [
    {
      title: "Procurement",
      items: [
        {
          label: "Procurements",
          href: "/dashboard/organization/procurements",
          icon: <ProcurementIcon />,
        },
        {
          label: "Solicitations",
          href: "/dashboard/organization/solicitations",
          icon: <SolicitationIcon />,
        },
        {
          label: "Bids",
          href: "/dashboard/organization/bids",
          icon: <BidIcon />,
        },
        {
          label: "Evaluations",
          href: "/dashboard/organization/evaluations",
          icon: <EvaluationIcon />,
        },
        {
          label: "Awards",
          href: "/dashboard/organization/awards",
          icon: <AwardIcon />,
        },
        {
          label: "Contracts",
          href: "/dashboard/organization/contracts",
          icon: <ContractIcon />,
        },
        {
          label: "Vendors",
          href: "/dashboard/organization/vendors",
          icon: <VendorIcon />,
        },
      ],
    },
    {
      title: "Organization",
      items: [
        {
          label: "Departments",
          href: "/dashboard/organization/departments",
          icon: <OrganizationIcon />,
        },
        {
          label: "Members",
          href: "/dashboard/organization/members",
          icon: <VendorIcon />,
        },
        {
          label: "Verification & Compliance",
          href: "/dashboard/organization/verification",
          icon: <VerificationIcon />,
        },
        {
          label: "Settings",
          href: "/dashboard/organization/settings",
          icon: <SettingsIcon />,
        },
      ],
    },
  ];

  const vendorSections: SidebarSection[] = [
    {
      title: "Procurement",
      items: [
        {
          label: "Solicitations",
          href: "/dashboard/vendor/solicitations",
          icon: <SolicitationIcon />,
        },
        {
          label: "My Bids",
          href: "/dashboard/vendor/bids",
          icon: <BidIcon />,
        },
        {
          label: "Awards",
          href: "/dashboard/vendor/awards",
          icon: <AwardIcon />,
        },
        {
          label: "Contracts",
          href: "/dashboard/vendor/contracts",
          icon: <ContractIcon />,
        },
      ],
    },
    {
      title: "Vendor",
      items: [
        {
          label: "Vendor Profile",
          href: "/dashboard/vendor/profile",
          icon: <VendorIcon />,
        },
        {
          label: "Settings",
          href: "/dashboard/vendor/settings",
          icon: <SettingsIcon />,
        },
      ],
    },
  ];

  const adminSections: SidebarSection[] = [
    {
      title: "Administration",
      items: [
        {
          label: "Organizations",
          href: "/dashboard/admin/organizations",
          icon: <OrganizationIcon />,
        },
        {
          label: "Vendors",
          href: "/dashboard/admin/vendors",
          icon: <VendorIcon />,
        },
        {
          label: "Solicitations",
          href: "/dashboard/admin/solicitations",
          icon: <SolicitationIcon />,
        },
        {
          label: "Settings",
          href: "/dashboard/admin/settings",
          icon: <SettingsIcon />,
        },
      ],
    },
  ];

  let roleSections: SidebarSection[] = [];

  if (role === "ORGANIZATION") {
    roleSections = organizationSections;
  }

  if (role === "VENDOR") {
    roleSections = vendorSections;
  }

  if (role === "ADMIN") {
    roleSections = adminSections;
  }

  const sections = [...commonSections, ...roleSections];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-tenderhub-navy text-sm font-bold text-tenderhub-gold">
            TH
          </span>

          <span className="text-lg font-bold tracking-tight text-tenderhub-navy">
            TenderHub
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        {sections.map((section) => (
          <div key={section.title} className="mb-7 last:mb-0">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {section.title}
            </p>

            <nav className="space-y-1" aria-label={section.title}>
              {section.items.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={`${section.title}-${item.href}-${item.label}`}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-tenderhub-navy text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-tenderhub-navy"
                    }`}
                  >
                    <span
                      className={`shrink-0 ${
                        active ? "text-tenderhub-gold" : "text-gray-400"
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-gray-200 p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-tenderhub-navy"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 18l-6-6 6-6"
            />
          </svg>

          <span>Back to TenderHub</span>
        </Link>
      </div>
    </aside>
  );
}