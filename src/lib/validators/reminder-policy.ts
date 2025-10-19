import { z } from "zod";

export const reminderPolicyCreateSchema = z.object({
  daysAfterDue: z.number().int().min(0).max(365),
  reminderType: z.enum(["EMAIL", "SMS"]),
  feeType: z.enum(["FIXED", "PERCENTAGE"]),
  feeAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  messageTemplate: z.string().min(10).max(1000),
});

export const reminderPolicyUpdateSchema = reminderPolicyCreateSchema.partial();

export type ReminderPolicyCreate = z.infer<typeof reminderPolicyCreateSchema>;
export type ReminderPolicyUpdate = z.infer<typeof reminderPolicyUpdateSchema>;
