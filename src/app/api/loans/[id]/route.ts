import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loans, installments } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/loans/[id]
 * Get loan details with installment schedule
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { organizationId } = await requireOrganization();
    const { id } = await context.params;

    // Get loan
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, id), eq(loans.organizationId, organizationId)),
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

    // Get installments
    const loanInstallments = await db
      .select()
      .from(installments)
      .where(eq(installments.loanId, id))
      .orderBy(installments.dueDate);

    // Calculate summary
    const totalAmount = loanInstallments.reduce(
      (sum, inst) => sum + inst.totalAmount,
      0
    );
    const paidAmount = loanInstallments.reduce(
      (sum, inst) => sum + inst.paidAmount,
      0
    );
    const remainingAmount = totalAmount - paidAmount;
    const overdueCount = loanInstallments.filter(
      (inst) => inst.status === "OVERDUE"
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        loan,
        installments: loanInstallments,
        summary: {
          totalAmount,
          paidAmount,
          remainingAmount,
          overdueCount,
          totalInstallments: loanInstallments.length,
          paidInstallments: loanInstallments.filter(
            (inst) => inst.status === "PAID"
          ).length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching loan:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

