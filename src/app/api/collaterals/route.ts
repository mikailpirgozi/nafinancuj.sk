import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collaterals, loans } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { createCollateralSchema } from "@/lib/validators";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/collaterals
 * Get all collaterals for the current organization
 */
export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();

    const searchParams = request.nextUrl.searchParams;
    const loanId = searchParams.get("loanId");

    if (loanId) {
      // Verify loan belongs to organization
      const loan = await db.query.loans.findFirst({
        where: and(eq(loans.id, loanId), eq(loans.organizationId, organizationId)),
      });

      if (!loan) {
        return NextResponse.json(
          {
            success: false,
            error: "Loan not found",
          },
          { status: 404 }
        );
      }

      const result = await db
        .select()
        .from(collaterals)
        .where(eq(collaterals.loanId, loanId));

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Get all collaterals for organization's loans
    const result = await db
      .select({
        collateral: collaterals,
        loan: loans,
      })
      .from(collaterals)
      .innerJoin(loans, eq(collaterals.loanId, loans.id))
      .where(eq(loans.organizationId, organizationId));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching collaterals:", error);

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
 * POST /api/collaterals
 * Create a new collateral
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const body = await request.json();

    // Validate input
    const validatedData = createCollateralSchema.parse(body);

    // Verify loan belongs to organization
    const loan = await db.query.loans.findFirst({
      where: and(
        eq(loans.id, validatedData.loanId),
        eq(loans.organizationId, organizationId)
      ),
    });

    if (!loan) {
      return NextResponse.json(
        {
          success: false,
          error: "Loan not found",
        },
        { status: 404 }
      );
    }

    // Create collateral
    const [collateral] = await db
      .insert(collaterals)
      .values(validatedData)
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: collateral,
        message: "Zabezpečenie bolo úspešne vytvorené",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating collateral:", error);

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

