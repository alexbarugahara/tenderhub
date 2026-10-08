"use client";

import React, { InputHTMLAttributes } from "react";

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: string;
}

export default function DatePicker({
  label,
  error,
  hint,
  className = "",
  id,
  ...props
}: DatePickerProps) {
  const inputId = id || "date-picker";

  const baseClasses =
    "w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

  const borderClasses = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-200"
    : "border-gray-300 focus:border-tenderhub-gold focus:ring-tenderhub-gold/20";

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <input
        {...props}
        id={inputId}
        type="date"
        className={`${baseClasses} ${borderClasses} ${className}`}
      />

      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!error && hint && (
        <p className="mt-1.5 text-sm text-gray-500">{hint}</p>
      )}
    </div>
  );
}