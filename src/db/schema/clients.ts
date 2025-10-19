import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  ico: varchar("ico", { length: 20 }).notNull(),
  foundedAt: date("founded_at"),
  employeesCount: integer("employees_count"),
  annualRevenue: integer("annual_revenue"), // in cents
  contactPerson: varchar("contact_person", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

