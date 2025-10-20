import { NextRequest, NextResponse } from "next/server";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMITS = {
  finstat: { requests: 10, windowMs: 60 * 1000 }, // 10 req/min
  generateReminders: { requests: 5, windowMs: 60 * 60 * 1000 }, // 5 req/hour
  generateContract: { requests: 20, windowMs: 60 * 60 * 1000 }, // 20 req/hour
  uploadDocument: { requests: 50, windowMs: 60 * 60 * 1000 }, // 50 req/hour
  default: { requests: 100, windowMs: 60 * 60 * 1000 }, // 100 req/hour
};

function getKey(userId: string, endpoint: string): string {
  return `${userId}:${endpoint}`;
}

function getCurrentEntry(key: string): RateLimitEntry {
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return { count: 0, resetTime: now + 60000 };
  }

  return entry;
}

/**
 * Simple in-memory rate limiter
 * For production, use Redis or similar distributed cache
 */
export function rateLimit(
  userId: string,
  endpoint: keyof typeof RATE_LIMITS = "default"
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const key = getKey(userId, endpoint);
  const limits = RATE_LIMITS[endpoint];
  let entry = getCurrentEntry(key);

  entry.count += 1;
  const now = Date.now();

  // Reset if window has passed
  if (now > entry.resetTime) {
    entry = { count: 1, resetTime: now + limits.windowMs };
  }

  rateLimitStore.set(key, entry);

  const allowed = entry.count <= limits.requests;
  const remaining = Math.max(0, limits.requests - entry.count);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    limit: limits.requests,
  };
}

export function getRateLimitHeaders(
  result: ReturnType<typeof rateLimit>
): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimiters = {
  // Strict rate limit for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: "Too many authentication attempts, please try again later",
  }),

  // Moderate rate limit for API endpoints
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: "Too many API requests, please slow down",
  }),

  // Generous rate limit for public endpoints
  public: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: "Too many requests, please try again later",
  }),

  // Very strict for sensitive operations
  sensitive: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: "Too many sensitive operations, please try again later",
  }),

  // Reminders endpoint - 10 requests per hour (cron + manual)
  reminders: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    message: "Reminders generation rate limited, please try again later",
  }),

  // Contract generation - 20 requests per hour
  contracts: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    message: "Contract generation rate limited, please try again later",
  }),

  // Finstat API - 100 requests per day
  finstat: rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 100,
    message: "Finstat API rate limited, please try again tomorrow",
  }),

  // CSV import - 30 requests per hour
  csvImport: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 30,
    message: "CSV import rate limited, please try again later",
  }),
};

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime + 60000) {
      // Remove entries 1 minute after reset
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

