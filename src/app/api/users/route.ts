import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireOrganization, canManageUsers } from "@/lib/auth";
import { createUserSchema } from "@/lib/validators";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/users
 * Get all users for the current organization
 */
export async function GET() {
  try {
    const { organizationId, user } = await requireOrganization();

    if (!canManageUsers(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - Admin only",
        },
        { status: 403 }
      );
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.organizationId, organizationId))
      .orderBy(desc(users.createdAt));

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
    console.error("Error fetching users:", error);

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
 * POST /api/users
 * Create a new user (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId, user } = await requireOrganization();

    if (!canManageUsers(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden - Admin only",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = createUserSchema.parse({
      ...body,
      organizationId,
    });

    // Create user
    const [newUser] = await db.insert(users).values(validatedData).returning();

    return NextResponse.json(
      {
        success: true,
        data: newUser,
        message: "Používateľ bol úspešne vytvorený",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);

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

