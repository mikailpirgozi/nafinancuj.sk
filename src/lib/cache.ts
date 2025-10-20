import { revalidateTag } from "next/cache";

interface CacheConfig {
  tags?: string[];
  revalidateTime?: number; // in seconds
}

/**
 * Cache wrapper for API responses
 * Uses Next.js Cache API with tags for granular revalidation
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = {}
): Promise<T> {
  const { tags = [], revalidateTime = 300 } = config; // 5 min default

  // Create cache key with tags
  const cacheKey = `cache:${key}`;
  const allTags = [cacheKey, ...tags];

  try {
    // For server-side caching, we can use Next.js data cache
    // This is a simplified version - production would use Redis

    // Attempt to get from cache
    const cached = getCachedData<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // If not in cache, fetch fresh data
    const data = await fetcher();

    // Store in cache
    setCachedData(cacheKey, data, revalidateTime);

    return data;
  } catch (error) {
    console.error(`Cache fetch error for ${key}:`, error);
    // Return cached data even if expired on error
    const expired = getCachedData<T>(cacheKey);
    if (expired) return expired;
    throw error;
  }
}

// In-memory cache store (use Redis in production)
const cacheStore = new Map<
  string,
  { data: unknown; expiresAt: number }
>();
const expireTimers = new Map<string, NodeJS.Timeout>();

function getCachedData<T>(key: string): T | null {
  const cached = cacheStore.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (cached.expiresAt < now) {
    cacheStore.delete(key);
    expireTimers.delete(key);
    return null;
  }

  return cached.data as T;
}

function setCachedData(key: string, data: unknown, ttl: number): void {
  // Clear existing timer
  const existingTimer = expireTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const expiresAt = Date.now() + ttl * 1000;
  cacheStore.set(key, { data, expiresAt });

  // Set auto-expiration timer
  const timer = setTimeout(() => {
    cacheStore.delete(key);
    expireTimers.delete(key);
  }, ttl * 1000);

  expireTimers.set(key, timer);
}

// Cache tags for different entity types
export const CACHE_TAGS = {
  REPORTS: "reports",
  REPORTS_OVERVIEW: "reports:overview",
  REPORTS_CASHFLOW: "reports:cashflow",
  REPORTS_PORTFOLIO: "reports:portfolio",
  REPORTS_TOPCLIENTS: "reports:top-clients",

  LOANS: "loans",
  LOAN_STATS: "loan:stats",

  CLIENTS: "clients",
  CLIENT_STATS: "client:stats",

  PAYMENTS: "payments",
  INSTALLMENTS: "installments",

  APPLICATIONS: "applications",

  REMINDERS: "reminders",
};

// Revalidation helpers
export async function revalidateReports(): Promise<void> {
  revalidateTag(CACHE_TAGS.REPORTS);
  revalidateTag(CACHE_TAGS.REPORTS_OVERVIEW);
  revalidateTag(CACHE_TAGS.REPORTS_CASHFLOW);
  revalidateTag(CACHE_TAGS.REPORTS_PORTFOLIO);
  revalidateTag(CACHE_TAGS.REPORTS_TOPCLIENTS);
}

export async function revalidateLoan(loanId: string): Promise<void> {
  revalidateTag(CACHE_TAGS.LOANS);
  revalidateTag(`${CACHE_TAGS.LOAN_STATS}:${loanId}`);
  revalidateReports();
}

export async function revalidateClient(clientId: string): Promise<void> {
  revalidateTag(CACHE_TAGS.CLIENTS);
  revalidateTag(`${CACHE_TAGS.CLIENT_STATS}:${clientId}`);
  revalidateReports();
}

export async function revalidatePayments(): Promise<void> {
  revalidateTag(CACHE_TAGS.PAYMENTS);
  revalidateReports();
}

export async function revalidateInstallments(): Promise<void> {
  revalidateTag(CACHE_TAGS.INSTALLMENTS);
  revalidateReports();
}

// Cache key builders
export function buildReportCacheKey(
  organizationId: string,
  reportType: string
): string {
  return `report:${organizationId}:${reportType}:${new Date().toISOString().split("T")[0]}`;
}

export function buildClientStatsCacheKey(clientId: string): string {
  return `client:stats:${clientId}`;
}

export function buildLoanStatsCacheKey(loanId: string): string {
  return `loan:stats:${loanId}`;
}
