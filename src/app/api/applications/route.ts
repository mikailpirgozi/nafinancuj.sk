import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/applications
 * Get all applications for the current organization
 */
export async function GET(request: NextRequest) {
  try {
    const { organizationId, user } = await requireOrganization();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const assignedToMe = searchParams.get("assignedToMe") === "true";

    // Build where conditions
    const conditions = [eq(applications.organizationId, organizationId)];

    if (status) {
      conditions.push(eq(applications.status, status as never));
    }

    if (assignedToMe) {
      conditions.push(eq(applications.assignedToUserId, user.id));
    }

    const result = await db
      .select()
      .from(applications)
      .where(and(...conditions))
      .orderBy(desc(applications.createdAt));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

