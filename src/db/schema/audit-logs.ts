import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const auditActionEnum = pgEnum("audit_action", [
  "CREATE",
  "UPDATE",
  "DELETE",
]);

export const auditEntityTypeEnum = pgEnum("audit_entity_type", [
  "ORGANIZATION",
  "USER",
  "CLIENT",
  "APPLICATION",
  "LOAN",
  "INSTALLMENT",
  "PAYMENT",
  "COLLATERAL",
  "DOCUMENT",
  "REMINDER_POLICY",
  "REMINDER",
  "CONTRACT_TEMPLATE",
]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  userId: varchar("user_id", { length: 255 }).references(() => users.id, {
    onDelete: "set null",
  }),
  action: auditActionEnum("action").notNull(),
  entityType: auditEntityTypeEnum("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  changes: jsonb("changes").$type<{
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  }>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

