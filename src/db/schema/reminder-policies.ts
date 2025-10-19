import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  pgEnum,
  decimal,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const reminderTypeEnum = pgEnum("reminder_type", ["EMAIL", "SMS"]);

export const feeTypeEnum = pgEnum("fee_type", ["FIXED", "PERCENTAGE"]);

export const reminderPolicies = pgTable("reminder_policies", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  daysAfterDue: integer("days_after_due").notNull(),
  reminderType: reminderTypeEnum("reminder_type").notNull(),
  feeType: feeTypeEnum("fee_type").notNull(),
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull(), // For FIXED: amount in EUR, for PERCENTAGE: percentage value
  messageTemplate: text("message_template").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ReminderPolicy = typeof reminderPolicies.$inferSelect;
export type NewReminderPolicy = typeof reminderPolicies.$inferInsert;

