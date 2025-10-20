import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { applications } from "@/db/schema/applications";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const commentCreateSchema = z.object({
  content: z.string().min(1).max(2000),
});

// Mock storage for comments (would be a DB table in production)
const applicationComments: Record<string, Array<{ id: string; content: string; createdAt: string; createdBy: string }>> = {};

export async function GET(
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

    // Verify application exists
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const comments = applicationComments[applicationId] || [];

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error("Error fetching application comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Verify application exists
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = commentCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { content } = validation.data;

    const newComment = {
      id: `comment_${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };

    if (!applicationComments[applicationId]) {
      applicationComments[applicationId] = [];
    }

    applicationComments[applicationId].push(newComment);

    return NextResponse.json({ data: newComment }, { status: 201 });
  } catch (error) {
    console.error("Error creating application comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
