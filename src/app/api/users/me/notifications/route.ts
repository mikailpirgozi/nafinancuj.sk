import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const notificationUpdateSchema = z.object({
  emailNewApplications: z.boolean().optional(),
  emailApprovedLoans: z.boolean().optional(),
  emailOverduePayments: z.boolean().optional(),
  emailReceivedPayments: z.boolean().optional(),
  smsCriticalReminders: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        emailNewApplications: user.emailNewApplications || true,
        emailApprovedLoans: user.emailApprovedLoans || true,
        emailOverduePayments: user.emailOverduePayments || true,
        emailReceivedPayments: user.emailReceivedPayments || true,
        smsCriticalReminders: user.smsCriticalReminders || false,
      },
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = notificationUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Update user notifications
    const updated = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json({
      data: {
        emailNewApplications: updated.emailNewApplications || true,
        emailApprovedLoans: updated.emailApprovedLoans || true,
        emailOverduePayments: updated.emailOverduePayments || true,
        emailReceivedPayments: updated.emailReceivedPayments || true,
        smsCriticalReminders: updated.smsCriticalReminders || false,
      },
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
