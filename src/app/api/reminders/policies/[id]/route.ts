import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { reminderPolicies } from "@/db/schema";
import { reminderPolicyUpdateSchema } from "@/lib/validators/reminder-policy";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/reminders/policies/[id]
 * Update a reminder policy
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

    // Get user's organization_id and role
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User not associated with organization" },
        { status: 403 }
      );
    }

    // Only ADMIN, OWNER, SUPER_ADMIN can update policies
    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = reminderPolicyUpdateSchema.parse(body);

    const [policy] = await db
      .update(reminderPolicies)
      .set(validatedData)
      .where(
        and(
          eq(reminderPolicies.id, id),
          eq(reminderPolicies.organizationId, user.organizationId)
        )
      )
      .returning();

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json({ policy });
  } catch (error) {
    console.error("Error updating reminder policy:", error);
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
 * DELETE /api/reminders/policies/[id]
 * Delete a reminder policy
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

    // Get user's organization_id and role
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User not associated with organization" },
        { status: 403 }
      );
    }

    // Only ADMIN, OWNER, SUPER_ADMIN can delete policies
    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const [policy] = await db
      .delete(reminderPolicies)
      .where(
        and(
          eq(reminderPolicies.id, id),
          eq(reminderPolicies.organizationId, user.organizationId)
        )
      )
      .returning();

    if (!policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reminder policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

