import { z } from "zod";

export const userRoleSchema = z.enum([
  "SUPER_ADMIN",
  "OWNER",
  "ADMIN",
  "AGENT",
  "VIEWER",
]);

export const createUserSchema = z.object({
  id: z.string().min(1, "Clerk ID je povinné"), // Clerk user ID
  organizationId: z.string().uuid("Neplatné ID organizácie").optional(),
  role: userRoleSchema,
  email: z.string().email("Neplatný email"),
  name: z.string().min(1, "Meno je povinné").max(255),
});

export const updateUserSchema = z.object({
  organizationId: z.string().uuid().optional(),
  role: userRoleSchema.optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).max(255).optional(),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

