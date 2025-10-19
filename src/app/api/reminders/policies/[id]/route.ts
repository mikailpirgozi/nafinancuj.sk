import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { reminderPolicies } from "@/db/schema/reminder-policies";
import { users } from "@/db/schema/users";
import { reminderPolicyUpdateSchema } from "@/lib/validators/reminder-policy";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

async function verifyOwnership(policyId: string, organizationId: string) {
  const policy = await db
    .select()
    .from(reminderPolicies)
    .where(
      eq(reminderPolicies.id, policyId)
    )
    .limit(1)
    .then(rows => rows[0]);

  return policy?.organizationId === organizationId ? policy : null;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
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
      .where(eq(users.clerkId, userId))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const policy = await verifyOwnership(params.id, user.organizationId);
    if (!policy) {
      return NextResponse.json(
        { error: "Policy not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: policy });
  } catch (error) {
    console.error("Error fetching reminder policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
      .where(eq(users.clerkId, userId))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const policy = await verifyOwnership(params.id, user.organizationId);
    if (!policy) {
      return NextResponse.json(
        { error: "Policy not found or unauthorized" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = reminderPolicyUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updatedPolicy = await db
      .update(reminderPolicies)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(reminderPolicies.id, params.id))
      .returning();

    return NextResponse.json({ data: updatedPolicy[0] });
  } catch (error) {
    console.error("Error updating reminder policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
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
      .where(eq(users.clerkId, userId))
      .limit(1)
      .then(rows => rows[0]);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const policy = await verifyOwnership(params.id, user.organizationId);
    if (!policy) {
      return NextResponse.json(
        { error: "Policy not found or unauthorized" },
        { status: 404 }
      );
    }

    await db
      .delete(reminderPolicies)
      .where(eq(reminderPolicies.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting reminder policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

