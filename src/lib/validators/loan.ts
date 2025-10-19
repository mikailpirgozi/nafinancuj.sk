import { z } from "zod";

export const loanProductTypeSchema = z.enum(["AMORTIZING", "INTEREST_ONLY"]);

export const loanStatusSchema = z.enum([
  "PENDING",
  "ACTIVE",
  "LATE",
  "DEFAULTED",
  "CLOSED",
  "CANCELLED",
]);

export const createLoanSchema = z.object({
  organizationId: z.string().uuid("Neplatné ID organizácie"),
  clientId: z.string().uuid("Neplatné ID klienta"),
  applicationId: z.string().uuid().optional(),
  amount: z.number().int().positive("Suma musí byť kladná"), // in cents
  interestRateAnnual: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Neplatná úroková sadzba")
    .transform((val) => val), // e.g., "12.50"
  interestRateMonthly: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Neplatná úroková sadzba")
    .transform((val) => val), // e.g., "1.04"
  productType: loanProductTypeSchema,
  durationMonths: z
    .number()
    .int()
    .positive("Trvanie musí byť kladné")
    .max(360, "Maximálne trvanie je 360 mesiacov"),
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
  status: loanStatusSchema.default("PENDING"),
});

export const updateLoanSchema = createLoanSchema
  .partial()
  .omit({ organizationId: true });

export const updateLoanStatusSchema = z.object({
  status: loanStatusSchema,
});

export type LoanProductType = z.infer<typeof loanProductTypeSchema>;
export type LoanStatus = z.infer<typeof loanStatusSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type UpdateLoanStatusInput = z.infer<typeof updateLoanStatusSchema>;

