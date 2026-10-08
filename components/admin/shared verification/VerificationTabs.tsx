"use client";

import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ShieldCheck,
} from "lucide-react";

import type { VerificationTab } from "./types";

interface VerificationTabsProps {
  activeTab: VerificationTab;
  onChange: (tab: VerificationTab) => void;
}

const tabs: Array<{
  id: VerificationTab;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    id: "overview",
    label: "Overview",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  {
    id: "documents",
    label: "Documents",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    id: "verification",
    label: "Verification",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
];

export default function VerificationTabs({
  activeTab,
  onChange,
}: VerificationTabsProps) {
  return (
    <div className="overflow-x-auto border-b border-gray-200">
      <nav
        className="flex min-w-max gap-1"
        aria-label="Verification workspace"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-current={active ? "page" : undefined}
              className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                active
                  ? "text-tenderhub-navy"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.icon}
              {tab.label}

              {active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-tenderhub-gold" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}