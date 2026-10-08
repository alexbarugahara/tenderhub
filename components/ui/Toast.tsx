"use client";

import React, { ReactNode, useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  open: boolean;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
  action?: ReactNode;
}

export default function Toast({
  open,
  type = "info",
  title,
  message,
  duration = 5000,
  onClose,
  action,
}: ToastProps) {
  useEffect(() => {
    if (!open || duration <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, duration, onClose]);

  if (!open) {
    return null;
  }

  const typeClasses = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  const iconClasses = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  return (
    <div
      className="fixed right-4 top-4 z-[110] w-full max-w-sm"
      role="status"
      aria-live="polite"
    >
      <div
        className={`rounded-xl border p-4 shadow-lg ${typeClasses[type]}`}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 shrink-0 ${iconClasses[type]}`}>
            {type === "success" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m5 12 4 4L19 6"
                />
              </svg>
            )}

            {type === "error" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path
                  strokeLinecap="round"
                  d="m9 9 6 6m0-6-6 6"
                />
              </svg>
            )}

            {type === "warning" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3 2.8 19a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L12 3Z"
                />
                <path strokeLinecap="round" d="M12 9v4" />
                <path strokeLinecap="round" d="M12 17h.01" />
              </svg>
            )}

            {type === "info" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" d="M12 11v5" />
                <path strokeLinecap="round" d="M12 8h.01" />
              </svg>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{title}</p>

            {message && (
              <p className="mt-1 text-sm opacity-90">{message}</p>
            )}

            {action && <div className="mt-3">{action}</div>}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="shrink-0 rounded-md p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                d="m6 6 12 12M18 6 6 18"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}