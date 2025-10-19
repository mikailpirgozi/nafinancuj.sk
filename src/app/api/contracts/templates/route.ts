import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contractTemplates } from "@/db/schema";
import { createContractTemplateSchema } from "@/lib/validators/contract-template";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/contracts/templates
 * List all contract templates for the organization
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User not associated with organization" },
        { status: 403 }
      );
    }

    const templates = await db.query.contractTemplates.findMany({
      where: eq(contractTemplates.organizationId, user.organizationId),
      orderBy: [desc(contractTemplates.createdAt)],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching contract templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contracts/templates
 * Create a new contract template
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User not associated with organization" },
        { status: 403 }
      );
    }

    // Only ADMIN, OWNER, SUPER_ADMIN can create templates
    if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createContractTemplateSchema.parse({
      ...body,
      organizationId: user.organizationId,
    });

    const [template] = await db
      .insert(contractTemplates)
      .values(validatedData)
      .returning();

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Error creating contract template:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

