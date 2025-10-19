import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  date,
  pgEnum,
  decimal,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { clients } from "./clients";
import { applications } from "./applications";

export const loanProductTypeEnum = pgEnum("loan_product_type", [
  "AMORTIZING",
  "INTEREST_ONLY",
]);

export const loanStatusEnum = pgEnum("loan_status", [
  "PENDING",
  "ACTIVE",
  "LATE",
  "DEFAULTED",
  "CLOSED",
  "CANCELLED",
]);

export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, {
    onDelete: "set null",
  }),
  amount: integer("amount").notNull(), // in cents
  interestRateAnnual: decimal("interest_rate_annual", {
    precision: 5,
    scale: 2,
  }).notNull(), // e.g., 12.50 for 12.5%
  interestRateMonthly: decimal("interest_rate_monthly", {
    precision: 5,
    scale: 2,
  }).notNull(), // e.g., 1.04 for 1.04%
  productType: loanProductTypeEnum("product_type").notNull(),
  durationMonths: integer("duration_months").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: loanStatusEnum("status").notNull().default("PENDING"),
  variableSymbol: varchar("variable_symbol", { length: 20 })
    .notNull()
    .unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;

