import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { reminderPolicies } from "@/db/schema/reminder-policies";
import { users } from "@/db/schema/users";
import { reminderPolicyCreateSchema } from "@/lib/validators/reminder-policy";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization" },
        { status: 403 }
      );
    }

    const policies = await db
      .select()
      .from(reminderPolicies)
      .where(eq(reminderPolicies.organizationId, user.organizationId))
      .orderBy(reminderPolicies.daysAfterDue);

    return NextResponse.json({ data: policies });
  } catch (error) {
    console.error("Error fetching reminder policies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = reminderPolicyCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { daysAfterDue, reminderType, feeType, feeAmount, messageTemplate } =
      validation.data;

    const newPolicy = await db
      .insert(reminderPolicies)
      .values({
        organizationId: user.organizationId,
        daysAfterDue,
        reminderType,
        feeType,
        feeAmount,
        messageTemplate,
      })
      .returning();

    return NextResponse.json({ data: newPolicy[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

