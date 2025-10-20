import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/audit-logs";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    // Fetch audit logs for organization
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.organizationId, user.organizationId))
      .orderBy(auditLogs.timestamp)
      .limit(limit)
      .offset(offset);

    // Parse JSON changes field for each log
    const parsedLogs = logs.map((log) => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null,
    }));

    return NextResponse.json({
      data: parsedLogs,
      pagination: {
        page,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

