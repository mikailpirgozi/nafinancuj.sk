import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { loans } from "./loans";
import { installments } from "./installments";

export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "BANK_TRANSFER",
]);

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  loanId: uuid("loan_id")
    .notNull()
    .references(() => loans.id, { onDelete: "cascade" }),
  installmentId: uuid("installment_id").references(() => installments.id, {
    onDelete: "set null",
  }),
  amount: integer("amount").notNull(), // in cents
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  variableSymbol: varchar("variable_symbol", { length: 20 }),
  paidAt: timestamp("paid_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

