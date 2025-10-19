import {
  pgTable,
  uuid,
  integer,
  text,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { loans } from "./loans";

export const collateralTypeEnum = pgEnum("collateral_type", [
  "REAL_ESTATE",
  "VEHICLE",
  "OTHER",
]);

export const collaterals = pgTable("collaterals", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id")
    .notNull()
    .references(() => loans.id, { onDelete: "cascade" }),
  type: collateralTypeEnum("type").notNull(),
  description: text("description").notNull(),
  estimatedValue: integer("estimated_value").notNull(), // in cents
  details: jsonb("details").$type<{
    // For REAL_ESTATE
    address?: string;
    cadastralArea?: string;
    parcelNumber?: string;
    listOfOwnership?: string;
    // For VEHICLE
    vin?: string;
    licensePlate?: string;
    make?: string;
    model?: string;
    year?: number;
    // Other fields
    [key: string]: unknown;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Collateral = typeof collaterals.$inferSelect;
export type NewCollateral = typeof collaterals.$inferInsert;

