import {
  pgTable,
  uuid,
  integer,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { loans } from "./loans";

export const installmentStatusEnum = pgEnum("installment_status", [
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
]);

export const installments = pgTable("installments", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id")
    .notNull()
    .references(() => loans.id, { onDelete: "cascade" }),
  dueDate: date("due_date").notNull(),
  principalAmount: integer("principal_amount").notNull(), // in cents
  interestAmount: integer("interest_amount").notNull(), // in cents
  totalAmount: integer("total_amount").notNull(), // in cents
  paidAmount: integer("paid_amount").notNull().default(0), // in cents
  status: installmentStatusEnum("status").notNull().default("UNPAID"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Installment = typeof installments.$inferSelect;
export type NewInstallment = typeof installments.$inferInsert;

