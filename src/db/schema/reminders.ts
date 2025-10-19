import {
  pgTable,
  uuid,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { installments } from "./installments";
import { reminderPolicies } from "./reminder-policies";

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  installmentId: uuid("installment_id")
    .notNull()
    .references(() => installments.id, { onDelete: "cascade" }),
  policyId: uuid("policy_id")
    .notNull()
    .references(() => reminderPolicies.id, { onDelete: "cascade" }),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  feeCharged: integer("fee_charged").notNull(), // in cents
});

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;

