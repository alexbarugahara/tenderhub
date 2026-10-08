import React, { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  footer?: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

export function Card({
  children,
  title,
  description,
  headerAction,
  footer,
  padding = "md",
  className = "",
}: CardProps) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-4",
    md: "p-5",
    lg: "p-6",
  };

  const hasHeader = Boolean(title || description || headerAction);

  return (
    <section
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold text-tenderhub-navy">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-sm leading-6 text-gray-500">
                {description}
              </p>
            )}
          </div>

          {headerAction && (
            <div className="shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}

      <div className={paddingClasses[padding]}>
        {children}
      </div>

      {footer && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          {footer}
        </div>
      )}
    </section>
  );
}

export default Card;