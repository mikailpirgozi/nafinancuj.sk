import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit-logs";

interface AuditLogEntry {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entityType: string;
  entityId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  description?: string;
  organizationId?: string;
}

export async function logAuditAction(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      changes: entry.changes ? JSON.stringify(entry.changes) : null,
      description: entry.description || null,
      organizationId: entry.organizationId || null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error logging audit action:", error);
    // Don't throw - audit logging should not break the main operation
  }
}

export async function getAuditLogs(
  organizationId: string,
  filters?: {
    entityType?: string;
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
) {
  try {
    let query = db
      .select()
      .from(auditLogs)
      .where((col) => col.organizationId === organizationId);

    // Note: In real implementation, add WHERE conditions based on filters
    // This is simplified version

    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;

    const logs = await query.limit(limit).offset(offset);
    return logs;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

export async function getEntityAuditHistory(
  entityId: string,
  entityType: string,
  organizationId: string
) {
  try {
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        (col) =>
          col.entityId === entityId &&
          col.entityType === entityType &&
          col.organizationId === organizationId
      )
      .orderBy(auditLogs.timestamp);

    return logs;
  } catch (error) {
    console.error("Error fetching entity audit history:", error);
    return [];
  }
}

