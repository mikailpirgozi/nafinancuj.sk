import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { reminderPolicies } from "@/db/schema";
import { reminderPolicyCreateSchema } from "@/lib/validators/reminder-policy";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/reminders/policies
 * List all reminder policies for the organization
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization_id from users table
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User not associated with organization" },
        { status: 403 }
      );
    }

    const policies = await db.query.reminderPolicies.findMany({
      where: eq(reminderPolicies.organizationId, user.organizationId),
      orderBy: (policies, { asc }) => [asc(policies.daysAfterDue)],
    });

    return NextResponse.json({ policies });
  } catch (error) {
    console.error("Error fetching reminder policies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reminders/policies
 * Create a new reminder policy
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Only ADMIN, OWNER, SUPER_ADMIN can create policies
    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = reminderPolicyCreateSchema.parse(body);

    const [policy] = await db
      .insert(reminderPolicies)
      .values({
        organizationId: user.organizationId,
        ...validatedData,
      })
      .returning();

    return NextResponse.json({ policy }, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder policy:", error);
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

