import { z } from "zod";

export const documentEntityTypeSchema = z.enum([
  "APPLICATION",
  "LOAN",
  "CLIENT",
]);

export const documentCategorySchema = z.enum([
  "APPRAISAL",
  "BANK_STATEMENT",
  "ID_CARD",
  "CONTRACT",
  "OTHER",
]);

export const createDocumentSchema = z.object({
  organizationId: z.string().uuid("Neplatné ID organizácie"),
  entityType: documentEntityTypeSchema,
  entityId: z.string().uuid("Neplatné ID entity"),
  category: documentCategorySchema,
  fileName: z.string().min(1, "Názov súboru je povinný").max(255),
  fileUrl: z.string().url("Neplatná URL"),
  uploadedBy: z.string().min(1, "ID používateľa je povinné"),
});

export const uploadDocumentRequestSchema = z.object({
  fileName: z.string().min(1, "Názov súboru je povinný").max(255),
  fileType: z.string().min(1, "Typ súboru je povinný"),
  entityType: documentEntityTypeSchema,
  entityId: z.string().uuid("Neplatné ID entity"),
  category: documentCategorySchema,
});

export type DocumentEntityType = z.infer<typeof documentEntityTypeSchema>;
export type DocumentCategory = z.infer<typeof documentCategorySchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UploadDocumentRequestInput = z.infer<
  typeof uploadDocumentRequestSchema
>;

