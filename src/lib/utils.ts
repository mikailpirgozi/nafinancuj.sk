import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert euros to cents
 */
export function eurosToCents(euros: number | string): number {
  const amount = typeof euros === "string" ? parseFloat(euros) : euros;
  return Math.round(amount * 100);
}

/**
 * Convert cents to euros
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}
