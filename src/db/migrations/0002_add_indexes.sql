-- Performance indexes for common queries

-- Loan indexes
CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans(client_id);
CREATE INDEX IF NOT EXISTS idx_loans_organization_id ON loans(organization_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_organization_status ON loans(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_created_at ON loans(created_at);

-- Installment indexes
CREATE INDEX IF NOT EXISTS idx_installments_loan_id ON installments(loan_id);
CREATE INDEX IF NOT EXISTS idx_installments_due_date ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_loan_status ON installments(loan_id, status);
CREATE INDEX IF NOT EXISTS idx_installments_due_date_status ON installments(due_date, status);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_installment_id ON payments(installment_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_loan_paid_at ON payments(loan_id, paid_at);

-- Reminder indexes
CREATE INDEX IF NOT EXISTS idx_reminders_installment_id ON reminders(installment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_loan_id ON reminders(loan_id);
CREATE INDEX IF NOT EXISTS idx_reminders_sent_at ON reminders(sent_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

-- Application indexes
CREATE INDEX IF NOT EXISTS idx_applications_client_id ON applications(client_id);
CREATE INDEX IF NOT EXISTS idx_applications_organization_id ON applications(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_org_status ON applications(organization_id, status);

-- Client indexes
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_timestamp ON audit_logs(organization_id, timestamp);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_loan_id ON documents(loan_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

