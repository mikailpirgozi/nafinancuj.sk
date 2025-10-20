/**
 * Input Sanitization Utilities
 * Provides protection against XSS, path traversal, and other injection attacks
 */

// XSS Protection - removes dangerous HTML/JavaScript
export function sanitizeHtml(input: string): string {
  if (!input) return "";

  // Remove script tags and event handlers
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/on\w+\s*=\s*'[^']*'/gi, "")
    .replace(/on\w+\s*=\s*[^\s>]*/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*/gi, "");

  // Remove data: and javascript: protocols
  sanitized = sanitized.replace(/data:/gi, "").replace(/javascript:/gi, "");

  return sanitized;
}

// Basic HTML escape
export function escapeHtml(text: string): string {
  if (!text) return "";

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Path Traversal Protection - prevents directory traversal attacks
export function sanitizePath(inputPath: string): string {
  if (!inputPath) return "";

  // Remove path traversal attempts
  let sanitized = inputPath
    .replace(/\.\./g, "") // Remove ..
    .replace(/~\//g, "") // Remove ~/
    .replace(/^\//g, "") // Remove leading /
    .replace(/\\/g, "/"); // Normalize backslashes

  // Allow only alphanumeric, hyphens, underscores, slashes, and dots
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_/.]/g, "");

  // Ensure path doesn't start with special chars
  while (sanitized.startsWith("-") || sanitized.startsWith("_")) {
    sanitized = sanitized.substring(1);
  }

  return sanitized;
}

// Filename sanitization
export function sanitizeFilename(filename: string): string {
  if (!filename) return "file";

  // Remove path separators
  let sanitized = filename.replace(/[\/\\]/g, "");

  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1F]/g, "");

  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, "");

  // Ensure it's not empty
  if (!sanitized) return "file";

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 250);
  }

  return sanitized;
}

// Email validation and normalization
export function sanitizeEmail(email: string): string {
  if (!email) return "";

  const sanitized = email
    .trim()
    .toLowerCase()
    .replace(/[<>()[\]\\,;:\s@"]/g, "");

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return "";
  }

  return sanitized;
}

// SQL Injection Prevention - basic string escaping (ORM handles most)
export function escapeSqlString(input: string): string {
  if (!input) return "''";

  const escaped = input
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .replace(/"/g, '\\"');

  return `'${escaped}'`;
}

// Phone number sanitization
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters except +
  let sanitized = phone.replace(/[^\d+]/g, "");

  // Remove leading zeros if there's a plus
  if (sanitized.startsWith("+")) {
    sanitized = "+" + sanitized.substring(1).replace(/^0+/, "");
  }

  // Limit length
  if (sanitized.length > 15) {
    sanitized = sanitized.substring(0, 15);
  }

  return sanitized;
}

// IČO (Slovak tax ID) validation and sanitization
export function sanitizeICO(ico: string): string {
  if (!ico) return "";

  // Remove all non-digit characters
  const sanitized = ico.replace(/\D/g, "");

  // IČO should be 8 digits
  if (sanitized.length !== 8) {
    return "";
  }

  return sanitized;
}

// Number sanitization - ensures input is valid number
export function sanitizeNumber(input: string | number): number | null {
  const num = typeof input === "string" ? parseFloat(input) : input;

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  return num;
}

// Currency amount sanitization - ensures 2 decimal places
export function sanitizeCurrency(input: string | number): number | null {
  const num = sanitizeNumber(input);
  if (num === null || num < 0) {
    return null;
  }

  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}

// Sanitize object - recursively sanitize all string values
export function sanitizeObject(
  obj: Record<string, unknown>,
  options: { htmlSafe?: boolean } = {}
): Record<string, unknown> {
  const sanitizer = options.htmlSafe ? escapeHtml : sanitizeHtml;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizer(value);
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      result[key] = value;
    }
  }

  return result;
}

