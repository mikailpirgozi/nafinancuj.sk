import { z } from "zod";

const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Clerk Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().default("/dashboard"),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().default("/dashboard"),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),

  // Database
  DATABASE_URL: z.string().min(1),

  // External APIs
  FINSTAT_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  TIMEZONE: z.string().default("Europe/Bratislava"),

  // Vercel Cron Secret (for scheduled reminders)
  CRON_SECRET: z.string().optional(),

  // Logging & Monitoring (optional)
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function validateEnv(): Env {
  if (validatedEnv) return validatedEnv;

  const env = process.env;

  const result = envSchema.safeParse(env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    });
    throw new Error("Invalid environment variables");
  }

  validatedEnv = result.data;

  console.log("✅ Environment variables validated successfully");
  return validatedEnv;
}

export function getEnv(): Env {
  if (!validatedEnv) {
    validateEnv();
  }
  return validatedEnv!;
}

