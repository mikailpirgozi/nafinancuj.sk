import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { applications } from "@/db/schema/applications";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    if (!user.organizationId) {
      return NextResponse.json(
        { error: "User is not associated with an organization" },
        { status: 403 }
      );
    }

    const applicationId = params.id;

    // Get application
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Update application status to APPROVED
    const updated = await db
      .update(applications)
      .set({ status: "APPROVED", updatedAt: new Date() })
      .where(eq(applications.id, applicationId))
      .returning()
      .then((rows) => rows[0]);

    // TODO: Send notification to client

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error approving application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

