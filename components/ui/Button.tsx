"use client";

import React, { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary:
      "bg-tenderhub-navy text-white hover:bg-tenderhub-navy/90 focus:ring-tenderhub-gold/30",
    secondary:
      "bg-tenderhub-gold text-tenderhub-navy hover:bg-tenderhub-gold/90 focus:ring-tenderhub-gold/30",
    outline:
      "border border-tenderhub-navy bg-white text-tenderhub-navy hover:bg-tenderhub-navy hover:text-white focus:ring-tenderhub-gold/30",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-200",
    ghost:
      "bg-transparent text-tenderhub-navy hover:bg-gray-100 focus:ring-gray-200",
  };

  const sizeClasses = {
    sm: "min-h-8 px-3 text-xs",
    md: "min-h-10 px-4 text-sm",
    lg: "min-h-12 px-6 text-base",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {leftIcon && (
            <span className="flex shrink-0 items-center" aria-hidden="true">
              {leftIcon}
            </span>
          )}

          <span>{children}</span>

          {rightIcon && (
            <span className="flex shrink-0 items-center" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  );
}