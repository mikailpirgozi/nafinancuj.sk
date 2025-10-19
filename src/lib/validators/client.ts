import { z } from "zod";

export const createClientSchema = z.object({
  organizationId: z.string().uuid("Neplatné ID organizácie"),
  companyName: z.string().min(1, "Názov firmy je povinný").max(255),
  ico: z
    .string()
    .min(8, "IČO musí mať 8 číslic")
    .max(8, "IČO musí mať 8 číslic")
    .regex(/^\d{8}$/, "IČO musí obsahovať len číslice"),
  foundedAt: z.string().optional(), // ISO date string
  employeesCount: z.number().int().positive().optional(),
  annualRevenue: z.number().int().positive().optional(), // in cents
  contactPerson: z.string().min(1, "Kontaktná osoba je povinná").max(255),
  email: z.string().email("Neplatný email"),
  phone: z
    .string()
    .min(1, "Telefón je povinný")
    .max(50)
    .regex(/^\+?\d{9,15}$/, "Neplatné telefónne číslo"),
});

export const updateClientSchema = createClientSchema.partial().omit({
  organizationId: true,
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

