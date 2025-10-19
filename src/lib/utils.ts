import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert optional value to nullable (for DB)
 */
export function toNullable<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

/**
 * Convert cents to euros
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Convert euros to cents
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Format amount in cents to EUR string
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: "EUR",
  }).format(centsToEuros(cents));
}

/**
 * Format date to Slovak format
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("sk-SK").format(d);
}

/**
 * Format datetime to Slovak format
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("sk-SK", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

