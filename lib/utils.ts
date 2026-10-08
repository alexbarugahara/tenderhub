// lib/utils.ts

/**
 * Format a date into a readable string.
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Truncate long text.
 */
export function truncate(
  text: string,
  maxLength = 120
): string {
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength) + "...";
}

/**
 * Capitalize first letter.
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Format currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate slug from text.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Delay helper (useful for testing)
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}