import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contractTemplates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { contractTemplateUpdateSchema } from "@/lib/validators/contract-template";
import { NextRequest, NextResponse } from "next/server";

async function verifyOwnership(templateId: string, userId: string) {
  const user = await db
    .select()
    .from("users")
    .where(eq("users.clerkId", userId))
    .limit(1)
    .execute();

  if (!user || user.length === 0) {
    return null;
  }

  const organizationId = (user[0] as any).organizationId;

  const template = await db
    .select()
    .from(contractTemplates)
    .where(and(eq(contractTemplates.id, templateId), eq(contractTemplates.organizationId, organizationId)))
    .limit(1)
    .execute();

  return template.length > 0 ? template[0] : null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await verifyOwnership(params.id, userId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await verifyOwnership(params.id, userId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const body = await req.json();
    const validation = contractTemplateUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const result = await db
      .update(contractTemplates)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(contractTemplates.id, params.id))
      .returning();

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const template = await verifyOwnership(params.id, userId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    await db.delete(contractTemplates).where(eq(contractTemplates.id, params.id));

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}

