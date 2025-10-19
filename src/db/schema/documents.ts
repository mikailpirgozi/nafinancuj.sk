import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const documentEntityTypeEnum = pgEnum("document_entity_type", [
  "APPLICATION",
  "LOAN",
  "CLIENT",
]);

export const documentCategoryEnum = pgEnum("document_category", [
  "APPRAISAL",
  "BANK_STATEMENT",
  "ID_CARD",
  "CONTRACT",
  "OTHER",
]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  entityType: documentEntityTypeEnum("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  category: documentCategoryEnum("category").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedBy: varchar("uploaded_by", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

