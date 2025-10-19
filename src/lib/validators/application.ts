import { z } from "zod";

export const applicationStatusSchema = z.enum([
  "NEW",
  "REVIEWING",
  "DOCUMENTS_REQUESTED",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
]);

export const createApplicationSchema = z.object({
  organizationId: z.string().uuid("Neplatné ID organizácie"),
  clientId: z.string().uuid("Neplatné ID klienta"),
  assignedToUserId: z.string().optional(),
  status: applicationStatusSchema.default("NEW"),
  amount: z.number().int().positive("Suma musí byť kladná"), // in cents
  purpose: z.string().min(1, "Účel je povinný").max(255),
  durationMonths: z
    .number()
    .int()
    .positive("Trvanie musí byť kladné")
    .max(360, "Maximálne trvanie je 360 mesiacov"),
  collateralDescription: z.string().optional(),
  collateralValue: z.number().int().positive().optional(), // in cents
});

export const updateApplicationSchema = createApplicationSchema
  .partial()
  .omit({ organizationId: true });

export const updateApplicationStatusSchema = z.object({
  status: applicationStatusSchema,
});

export const assignApplicationSchema = z.object({
  assignedToUserId: z.string().min(1, "User ID je povinné"),
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;
export type AssignApplicationInput = z.infer<typeof assignApplicationSchema>;

