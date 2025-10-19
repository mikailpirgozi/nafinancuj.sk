import { z } from "zod";

export const contractTypeSchema = z.enum([
  "LOAN_AGREEMENT",
  "COLLATERAL_AGREEMENT",
  "OTHER",
]);

export const createContractTemplateSchema = z.object({
  organizationId: z.string().uuid("Neplatné ID organizácie"),
  name: z.string().min(1, "Názov je povinný").max(255),
  type: contractTypeSchema,
  templateContent: z.string().min(1, "Obsah šablóny je povinný"),
  variables: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  isActive: z.boolean().default(true),
});

export const updateContractTemplateSchema = createContractTemplateSchema
  .partial()
  .omit({ organizationId: true });

export const generateContractSchema = z.object({
  templateId: z.string().uuid("Neplatné ID šablóny"),
  loanId: z.string().uuid("Neplatné ID úveru"),
  variables: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
});

export type ContractType = z.infer<typeof contractTypeSchema>;
export type CreateContractTemplateInput = z.infer<
  typeof createContractTemplateSchema
>;
export type UpdateContractTemplateInput = z.infer<
  typeof updateContractTemplateSchema
>;
export type GenerateContractInput = z.infer<typeof generateContractSchema>;

