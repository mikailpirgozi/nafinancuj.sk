import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { organizations } from "@/db/schema/organizations";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const organizationUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  ico: z.string().optional(),
  dic: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
});

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

    const organizationId = params.id;

    // Verify user belongs to organization
    if (user.organizationId !== organizationId) {
      return NextResponse.json(
        { error: "Forbidden - not your organization" },
        { status: 403 }
      );
    }

    // Verify organization exists
    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = organizationUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Update organization
    const updated = await db
      .update(organizations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId))
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
