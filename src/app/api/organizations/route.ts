import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { requireAuth, isSuperAdmin } from "@/lib/auth";
import { createOrganizationSchema } from "@/lib/validators";
import { desc } from "drizzle-orm";

/**
 * GET /api/organizations
 * Get all organizations (Super Admin only)
 */
export async function GET() {
  try {
    const user = await requireAuth();

    if (!isSuperAdmin(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - Super Admin only",
        },
        { status: 403 }
      );
    }

    const result = await db
      .select()
      .from(organizations)
      .orderBy(desc(organizations.createdAt));

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
    console.error("Error fetching organizations:", error);

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
 * POST /api/organizations
 * Create a new organization (Super Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!isSuperAdmin(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - Super Admin only",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = createOrganizationSchema.parse(body);

    // Create organization
    const [organization] = await db
      .insert(organizations)
      .values(validatedData)
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: organization,
        message: "Organizácia bola úspešne vytvorená",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating organization:", error);

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

