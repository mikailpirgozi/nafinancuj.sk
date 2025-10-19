import { z } from "zod";

export const contractTemplateCreateSchema = z.object({
  name: z.string().min(3, "Názov musí mať minimálne 3 znaky").max(255),
  type: z.enum(["LOAN_AGREEMENT", "COLLATERAL_AGREEMENT", "OTHER"]),
  templateContent: z.string().min(50, "Obsah šablóny musí mať minimálne 50 znakov").max(50000),
  isActive: z.boolean().default(true),
});

export const contractTemplateUpdateSchema = contractTemplateCreateSchema.partial();

export const contractGenerateSchema = z.object({
  templateId: z.string().uuid("Neplatné ID šablóny"),
  loanId: z.string().uuid("Neplatné ID úveru"),
  variables: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export type ContractTemplateCreate = z.infer<typeof contractTemplateCreateSchema>;
export type ContractTemplateUpdate = z.infer<typeof contractTemplateUpdateSchema>;
export type ContractGenerate = z.infer<typeof contractGenerateSchema>;

