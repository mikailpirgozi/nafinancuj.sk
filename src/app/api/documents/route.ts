import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { createDocumentSchema } from "@/lib/validators";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/documents
 * Get all documents for the current organization
 */
export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();

    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    const conditions = [eq(documents.organizationId, organizationId)];

    if (entityType) {
      conditions.push(eq(documents.entityType, entityType as never));
    }

    if (entityId) {
      conditions.push(eq(documents.entityId, entityId));
    }

    const result = await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.uploadedAt));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
      }
    );
  }
}

/**
 * POST /api/documents
 * Create a document record after upload
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId, user } = await requireOrganization();
    const body = await request.json();

    // Validate input
    const validatedData = createDocumentSchema.parse({
      ...body,
      organizationId,
      uploadedBy: user.id,
    });

    // Create document record
    const [document] = await db
      .insert(documents)
      .values(validatedData)
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: document,
        message: "Dokument bol úspešne nahraný",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating document:", error);

    if (error instanceof Error && "issues" in error) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status:
          error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
      }
    );
  }
}

