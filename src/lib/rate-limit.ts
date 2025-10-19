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

/**
 * Simple in-memory rate limiter
 * For production, use Redis or similar distributed cache
 */
export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, message = "Too many requests" } = options;

  return async (req: NextRequest): Promise<NextResponse | null> => {
    // Get identifier (IP address or user ID)
    const identifier =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const key = `${identifier}:${req.nextUrl.pathname}`;

    // Clean up expired entries
    if (store[key] && store[key].resetTime < now) {
      delete store[key];
    }

    // Initialize or increment counter
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[key].count++;
    }

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      const resetIn = Math.ceil((store[key].resetTime - now) / 1000);

      return NextResponse.json(
        {
          error: message,
          retryAfter: resetIn,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetIn.toString(),
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(store[key].resetTime).toISOString(),
          },
        }
      );
    }

    return null; // Continue to next middleware/handler
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

/**
 * Cleanup old entries periodically
 */
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      Object.keys(store).forEach((key) => {
        if (store[key].resetTime < now) {
          delete store[key];
        }
      });
    },
    60 * 1000
  ); // Clean up every minute
}

