import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { updateApplicationSchema } from "@/lib/validators";
import { eq, and } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/applications/[id]
 * Get application by ID
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = await context.params;

    const application = await db.query.applications.findFirst({
      where: and(
        eq(applications.id, id),
        eq(applications.organizationId, organizationId)
      ),
    });

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error: "Application not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

/**
 * PATCH /api/applications/[id]
 * Update application
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
    const validatedData = updateApplicationSchema.parse(body);

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

    // Update application
    const [updated] = await db
      .update(applications)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating application:", error);

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

/**
 * DELETE /api/applications/[id]
 * Delete application
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = await context.params;

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

    // Delete application
    await db.delete(applications).where(eq(applications.id, id));

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting application:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

