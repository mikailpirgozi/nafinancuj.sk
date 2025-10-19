import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contractTemplates, organizations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { contractTemplateCreateSchema } from "@/lib/validators/contract-template";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await db
      .select()
      .from("users")
      .where(eq("users.clerkId", userId))
      .limit(1)
      .execute();

    if (!user || user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const organizationId = (user[0] as any).organizationId;

    // Fetch templates
    const templates = await db
      .select()
      .from(contractTemplates)
      .where(eq(contractTemplates.organizationId, organizationId))
      .orderBy(contractTemplates.createdAt);

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = contractTemplateCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await db
      .select()
      .from("users")
      .where(eq("users.clerkId", userId))
      .limit(1)
      .execute();

    if (!user || user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const organizationId = (user[0] as any).organizationId;

    // Create template
    const result = await db
      .insert(contractTemplates)
      .values({
        organizationId,
        name: validation.data.name,
        type: validation.data.type,
        templateContent: validation.data.templateContent,
        isActive: validation.data.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: result[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

