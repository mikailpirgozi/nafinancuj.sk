import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients, loans, applications } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { updateClientSchema } from "@/lib/validators";
import { eq, and } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/clients/[id]
 * Get client details with loans
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = await context.params;

    // Get client
    const client = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.organizationId, organizationId)
      ),
    });

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          error: "Client not found",
        },
        { status: 404 }
      );
    }

    // Get client's loans
    const clientLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.clientId, id));

    // Get client's applications
    const clientApplications = await db
      .select()
      .from(applications)
      .where(eq(applications.clientId, id));

    return NextResponse.json({
      success: true,
      data: client,
    });
  } catch (error) {
    console.error("Error fetching client:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
      }
    );
  }
}

/**
 * PATCH /api/clients/[id]
 * Update client
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const validatedData = updateClientSchema.parse(body);

    // Check if client exists
    const existing = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.organizationId, organizationId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Client not found",
        },
        { status: 404 }
      );
    }

    // Update client
    const [updated] = await db
      .update(clients)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Klient bol úspešne aktualizovaný",
    });
  } catch (error) {
    console.error("Error updating client:", error);

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
      {
        status:
          error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
      }
    );
  }
}

/**
 * DELETE /api/clients/[id]
 * Delete client
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = await context.params;

    // Check if client exists
    const existing = await db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.organizationId, organizationId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Client not found",
        },
        { status: 404 }
      );
    }

    // Delete client (cascade will delete related records)
    await db.delete(clients).where(eq(clients.id, id));

    return NextResponse.json({
      success: true,
      message: "Klient bol úspešne zmazaný",
    });
  } catch (error) {
    console.error("Error deleting client:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
      }
    );
  }
}

