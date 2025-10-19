import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const contractTypeEnum = pgEnum("contract_type", [
  "LOAN_AGREEMENT",
  "COLLATERAL_AGREEMENT",
  "OTHER",
]);

export const contractTemplates = pgTable("contract_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: contractTypeEnum("type").notNull(),
  templateContent: text("template_content").notNull(), // HTML/React template with variables
  variables: jsonb("variables").$type<{
    // List of available variables in the template
    // e.g., ["client_name", "amount", "interest_rate", "start_date", ...]
    [key: string]: string | number | boolean;
  }>(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type NewContractTemplate = typeof contractTemplates.$inferInsert;

