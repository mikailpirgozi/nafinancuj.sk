import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, "Názov je povinný").max(255),
  slug: z
    .string()
    .min(1, "Slug je povinný")
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug môže obsahovať len malé písmená, čísla a pomlčky"),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

