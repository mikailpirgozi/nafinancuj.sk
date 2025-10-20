import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contractTemplates } from "@/db/schema/contract-templates";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(
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

    const templateId = params.id;

    // Verify template exists and belongs to organization
    const template = await db
      .select()
      .from(contractTemplates)
      .where(eq(contractTemplates.id, templateId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "Forbidden - not your template" },
        { status: 403 }
      );
    }

    // Cannot delete default template
    if (template.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default template" },
        { status: 400 }
      );
    }

    // Delete template
    await db
      .delete(contractTemplates)
      .where(eq(contractTemplates.id, templateId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
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

    const templateId = params.id;

    // Verify template exists and belongs to organization
    const template = await db
      .select()
      .from(contractTemplates)
      .where(eq(contractTemplates.id, templateId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (template.organizationId !== user.organizationId) {
      return NextResponse.json(
        { error: "Forbidden - not your template" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const updated = await db
      .update(contractTemplates)
      .set({
        name: body.name || template.name,
        description: body.description !== undefined ? body.description : template.description,
        content: body.content || template.content,
        updatedAt: new Date(),
      })
      .where(eq(contractTemplates.id, templateId))
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

