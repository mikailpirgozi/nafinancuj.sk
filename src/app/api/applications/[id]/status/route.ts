import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { updateApplicationStatusSchema } from "@/lib/validators";
import { eq, and } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/applications/[id]/status
 * Update application status
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const { status } = updateApplicationStatusSchema.parse(body);

    // Check if application exists and belongs to organization
    const existing = await db.query.applications.findFirst({
      where: and(
        eq(applications.id, id),
        eq(applications.organizationId, organizationId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Application not found",
        },
        { status: 404 }
      );
    }

    // Update status
    const [updated] = await db
      .update(applications)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Status zmenený na ${status}`,
    });
  } catch (error) {
    console.error("Error updating application status:", error);

    if (error instanceof Error && "issues" in error) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

