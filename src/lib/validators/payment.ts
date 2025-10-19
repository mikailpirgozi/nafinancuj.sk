import { z } from "zod";

export const paymentMethodSchema = z.enum(["CASH", "BANK_TRANSFER", "CARD", "OTHER"]);

export const createPaymentSchema = z.object({
  loanId: z.string().uuid("Neplatné ID úveru"),
  installmentId: z.string().uuid().optional(),
  amount: z.number().int().positive("Suma musí byť kladná"), // in cents
  paymentMethod: paymentMethodSchema,
  variableSymbol: z.string().max(20).optional(),
  paidAt: z.string(), // ISO datetime string
  notes: z.string().optional(),
});

export const updatePaymentSchema = createPaymentSchema.partial().omit({
  loanId: true,
});

export const importPaymentsCsvSchema = z.object({
  csvData: z.string().min(1, "CSV dáta sú povinné"),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
export type ImportPaymentsCsvInput = z.infer<typeof importPaymentsCsvSchema>;

