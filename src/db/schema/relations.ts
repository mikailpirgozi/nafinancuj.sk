import { relations } from "drizzle-orm";
import { organizations } from "./organizations";
import { users } from "./users";
import { clients } from "./clients";
import { applications } from "./applications";
import { loans } from "./loans";
import { installments } from "./installments";
import { payments } from "./payments";
import { collaterals } from "./collaterals";
import { documents } from "./documents";
import { reminderPolicies } from "./reminder-policies";
import { reminders } from "./reminders";
import { contractTemplates } from "./contract-templates";
import { auditLogs } from "./audit-logs";

// Organizations relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  applications: many(applications),
  loans: many(loans),
  documents: many(documents),
  reminderPolicies: many(reminderPolicies),
  contractTemplates: many(contractTemplates),
  auditLogs: many(auditLogs),
}));

// Users relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  assignedApplications: many(applications),
  auditLogs: many(auditLogs),
}));

// Clients relations
export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  applications: many(applications),
  loans: many(loans),
}));

// Applications relations
export const applicationsRelations = relations(applications, ({ one }) => ({
  organization: one(organizations, {
    fields: [applications.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [applications.clientId],
    references: [clients.id],
  }),
  assignedTo: one(users, {
    fields: [applications.assignedToUserId],
    references: [users.id],
  }),
}));

// Loans relations
export const loansRelations = relations(loans, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [loans.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [loans.clientId],
    references: [clients.id],
  }),
  application: one(applications, {
    fields: [loans.applicationId],
    references: [applications.id],
  }),
  installments: many(installments),
  payments: many(payments),
  collaterals: many(collaterals),
}));

// Installments relations
export const installmentsRelations = relations(installments, ({ one, many }) => ({
  loan: one(loans, {
    fields: [installments.loanId],
    references: [loans.id],
  }),
  payments: many(payments),
  reminders: many(reminders),
}));

// Payments relations
export const paymentsRelations = relations(payments, ({ one }) => ({
  loan: one(loans, {
    fields: [payments.loanId],
    references: [loans.id],
  }),
  installment: one(installments, {
    fields: [payments.installmentId],
    references: [installments.id],
  }),
}));

// Collaterals relations
export const collateralsRelations = relations(collaterals, ({ one }) => ({
  loan: one(loans, {
    fields: [collaterals.loanId],
    references: [loans.id],
  }),
}));

// Documents relations
export const documentsRelations = relations(documents, ({ one }) => ({
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

// Reminder Policies relations
export const reminderPoliciesRelations = relations(
  reminderPolicies,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [reminderPolicies.organizationId],
      references: [organizations.id],
    }),
    reminders: many(reminders),
  })
);

// Reminders relations
export const remindersRelations = relations(reminders, ({ one }) => ({
  installment: one(installments, {
    fields: [reminders.installmentId],
    references: [installments.id],
  }),
  policy: one(reminderPolicies, {
    fields: [reminders.policyId],
    references: [reminderPolicies.id],
  }),
}));

// Contract Templates relations
export const contractTemplatesRelations = relations(
  contractTemplates,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [contractTemplates.organizationId],
      references: [organizations.id],
    }),
  })
);

// Audit Logs relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

