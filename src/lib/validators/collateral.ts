import { z } from "zod";

export const collateralTypeSchema = z.enum([
  "REAL_ESTATE",
  "VEHICLE",
  "OTHER",
]);

export const createCollateralSchema = z.object({
  loanId: z.string().uuid("Neplatné ID úveru"),
  type: collateralTypeSchema,
  description: z.string().min(1, "Popis je povinný"),
  estimatedValue: z.number().int().positive("Hodnota musí byť kladná"), // in cents
  details: z
    .object({
      // For REAL_ESTATE
      address: z.string().optional(),
      cadastralArea: z.string().optional(),
      parcelNumber: z.string().optional(),
      listOfOwnership: z.string().optional(),
      // For VEHICLE
      vin: z.string().optional(),
      licensePlate: z.string().optional(),
      make: z.string().optional(),
      model: z.string().optional(),
      year: z.number().int().optional(),
    })
    .optional(),
});

export const updateCollateralSchema = createCollateralSchema
  .partial()
  .omit({ loanId: true });

export type CollateralType = z.infer<typeof collateralTypeSchema>;
export type CreateCollateralInput = z.infer<typeof createCollateralSchema>;
export type UpdateCollateralInput = z.infer<typeof updateCollateralSchema>;

