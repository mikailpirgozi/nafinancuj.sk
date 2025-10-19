import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { clients } from "./clients";
import { users } from "./users";

export const applicationStatusEnum = pgEnum("application_status", [
  "NEW",
  "REVIEWING",
  "DOCUMENTS_REQUESTED",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
]);

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  assignedToUserId: varchar("assigned_to_user_id", { length: 255 }).references(
    () => users.id,
    { onDelete: "set null" }
  ),
  status: applicationStatusEnum("status").notNull().default("NEW"),
  amount: integer("amount").notNull(), // in cents
  purpose: varchar("purpose", { length: 255 }).notNull(),
  durationMonths: integer("duration_months").notNull(),
  collateralDescription: text("collateral_description"),
  collateralValue: integer("collateral_value"), // in cents
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

