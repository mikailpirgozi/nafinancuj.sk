import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, clients } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      .select({
        id: applications.id,
        clientId: applications.clientId,
        amount: applications.amount,
        purpose: applications.purpose,
        status: applications.status,
        durationMonths: applications.durationMonths,
        assignedToUserId: applications.assignedToUserId,
        createdAt: applications.createdAt,
        client: {
          companyName: clients.companyName,
          contactPerson: clients.contactPerson,
        },
      })
      .from(applications)
      .leftJoin(clients, eq(applications.clientId, clients.id))
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

