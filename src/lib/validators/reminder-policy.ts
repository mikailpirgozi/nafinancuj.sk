import { z } from "zod";

export const reminderTypeSchema = z.enum(["EMAIL", "SMS"]);

export const feeTypeSchema = z.enum(["FIXED", "PERCENTAGE"]);

export const createReminderPolicySchema = z.object({
  organizationId: z.string().uuid("Neplatné ID organizácie"),
  daysAfterDue: z.number().int().positive("Dni musia byť kladné"),
  reminderType: reminderTypeSchema,
  feeType: feeTypeSchema,
  feeAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Neplatná výška poplatku")
    .transform((val) => val), // For FIXED: amount in EUR, for PERCENTAGE: percentage value
  messageTemplate: z.string().min(1, "Šablóna správy je povinná"),
});

export const updateReminderPolicySchema = createReminderPolicySchema
  .partial()
  .omit({ organizationId: true });

export type ReminderType = z.infer<typeof reminderTypeSchema>;
export type FeeType = z.infer<typeof feeTypeSchema>;
export type CreateReminderPolicyInput = z.infer<
  typeof createReminderPolicySchema
>;
export type UpdateReminderPolicyInput = z.infer<
  typeof updateReminderPolicySchema
>;

