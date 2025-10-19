import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contractTemplates } from "@/db/schema";
import { updateContractTemplateSchema } from "@/lib/validators/contract-template";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/contracts/templates/[id]
 * Get a specific contract template
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User not associated with organization" },
        { status: 403 }
      );
    }

    const template = await db.query.contractTemplates.findFirst({
      where: and(
        eq(contractTemplates.id, id),
        eq(contractTemplates.organizationId, user.organizationId)
      ),
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error fetching contract template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contracts/templates/[id]
 * Update a contract template
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User not associated with organization" },
        { status: 403 }
      );
    }

    // Only ADMIN, OWNER, SUPER_ADMIN can update templates
    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = updateContractTemplateSchema.parse(body);

    const [template] = await db
      .update(contractTemplates)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(
        and(
          eq(contractTemplates.id, id),
          eq(contractTemplates.organizationId, user.organizationId)
        )
      )
      .returning();

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error updating contract template:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contracts/templates/[id]
 * Delete a contract template
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User not associated with organization" },
        { status: 403 }
      );
    }

    // Only ADMIN, OWNER, SUPER_ADMIN can delete templates
    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const [template] = await db
      .delete(contractTemplates)
      .where(
        and(
          eq(contractTemplates.id, id),
          eq(contractTemplates.organizationId, user.organizationId)
        )
      )
      .returning();

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contract template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

