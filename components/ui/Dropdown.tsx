"use client";

import React, { ReactNode, useEffect, useRef, useState } from "react";

export interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  align?: "left" | "right";
  disabled?: boolean;
  className?: string;
}

export default function Dropdown({
  trigger,
  items,
  onSelect,
  align = "right",
  disabled = false,
  className = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleSelect = (value: string, itemDisabled?: boolean) => {
    if (itemDisabled) {
      return;
    }

    onSelect(value);
    setOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block text-left ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
      >
        {trigger}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-2 min-w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg ${
            align === "left" ? "left-0" : "right-0"
          }`}
        >
          {items.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No options available
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.value}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleSelect(item.value, item.disabled)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.icon && (
                  <span className="flex shrink-0 items-center">
                    {item.icon}
                  </span>
                )}

                <span>{item.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}