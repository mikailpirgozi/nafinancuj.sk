import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { createClientSchema } from "@/lib/validators";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/clients
 * Get all clients for the current organization
 */
export async function GET() {
  try {
    const { organizationId } = await requireOrganization();

    const result = await db
      .select()
      .from(clients)
      .where(eq(clients.organizationId, organizationId))
      .orderBy(desc(clients.createdAt));

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching clients:", error);

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
 * POST /api/clients
 * Create a new client
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const body = await request.json();

    // Validate input
    const validatedData = createClientSchema.parse({
      ...body,
      organizationId,
    });

    // Create client
    const [client] = await db.insert(clients).values(validatedData).returning();

    return NextResponse.json(
      {
        success: true,
        data: client,
        message: "Klient bol úspešne vytvorený",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating client:", error);

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

