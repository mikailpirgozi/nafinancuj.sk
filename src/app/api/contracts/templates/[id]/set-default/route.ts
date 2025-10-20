import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contractTemplates } from "@/db/schema/contract-templates";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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

    // Remove default from all templates in organization
    await db
      .update(contractTemplates)
      .set({ isDefault: false })
      .where(eq(contractTemplates.organizationId, user.organizationId));

    // Set this template as default
    const updated = await db
      .update(contractTemplates)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(contractTemplates.id, templateId))
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error setting default template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

