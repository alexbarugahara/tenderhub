import React, { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "primary"
  | "secondary"
  | "gold";

export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

function getVariantClasses(
  variant: BadgeVariant | undefined,
): string {
  switch (variant) {
    case "success":
      return "bg-green-100 text-green-800";

    case "warning":
      return "bg-yellow-100 text-yellow-800";

    case "danger":
      return "bg-red-100 text-red-800";

    case "info":
      return "bg-blue-100 text-blue-800";

    case "primary":
      return "bg-tenderhub-navy text-white";

    case "secondary":
      return "bg-slate-100 text-slate-700";

    case "gold":
      return "bg-tenderhub-gold text-tenderhub-navy";

    case "default":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getDotClasses(
  variant: BadgeVariant | undefined,
): string {
  switch (variant) {
    case "success":
      return "bg-green-600";

    case "warning":
      return "bg-yellow-600";

    case "danger":
      return "bg-red-600";

    case "info":
      return "bg-blue-600";

    case "primary":
      return "bg-white";

    case "gold":
      return "bg-tenderhub-navy";

    case "secondary":
      return "bg-slate-500";

    case "default":
    default:
      return "bg-slate-500";
  }
}

function getSizeClasses(size: BadgeSize | undefined): string {
  switch (size) {
    case "sm":
      return "px-2 py-0.5 text-xs";

    case "md":
    default:
      return "px-2.5 py-1 text-xs";
  }
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-medium",
        getSizeClasses(size),
        getVariantClasses(variant),
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`mr-1.5 h-1.5 w-1.5 rounded-full ${getDotClasses(variant)}`}
        />
      )}

      {children}
    </span>
  );
}

export default Badge;
