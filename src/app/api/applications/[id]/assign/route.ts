import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { assignApplicationSchema } from "@/lib/validators";
import { eq, and } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH /api/applications/[id]/assign
 * Assign application to a user
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
    const { assignedToUserId } = assignApplicationSchema.parse(body);

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

    // Update assigned user
    const [updated] = await db
      .update(applications)
      .set({
        assignedToUserId,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Žiadosť bola pridelená",
    });
  } catch (error) {
    console.error("Error assigning application:", error);

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

