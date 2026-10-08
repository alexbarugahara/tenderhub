"use client";

import React, { ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  defaultTab,
  activeTab,
  onChange,
  className = "",
}: TabsProps) {
  const initialTab =
    defaultTab || tabs.find((tab) => !tab.disabled)?.id || "";

  const [internalActiveTab, setInternalActiveTab] = React.useState(initialTab);

  const selectedTab = activeTab ?? internalActiveTab;

  const handleChange = (tabId: string) => {
    setInternalActiveTab(tabId);
    onChange?.(tabId);
  };

  const currentTab = tabs.find((tab) => tab.id === selectedTab);

  return (
    <div className={`w-full ${className}`}>
      <div
        className="flex w-full overflow-x-auto border-b border-gray-200"
        role="tablist"
        aria-label="Tabs"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === selectedTab;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => handleChange(tab.id)}
              className={`relative whitespace-nowrap px-5 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-tenderhub-gold/30 disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? "text-tenderhub-navy"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}

              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-tenderhub-gold" />
              )}
            </button>
          );
        })}
      </div>

      {currentTab && (
        <div
          id={`tabpanel-${currentTab.id}`}
          role="tabpanel"
          aria-labelledby={currentTab.id}
          className="pt-5"
        >
          {currentTab.content}
        </div>
      )}
    </div>
  );
}