import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loans, applications, installments } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { eq, and, gte, lte } from "drizzle-orm";

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/reports/overview
 * Get overview statistics for reports
 */
export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const dateFromStr = searchParams.get("from");
    const dateToStr = searchParams.get("to");

    // Parse dates - default to last 30 days
    const dateTo = dateToStr ? new Date(dateToStr) : new Date();
    const dateFrom = dateFromStr
      ? new Date(dateFromStr)
      : new Date(dateTo.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all loans for organization
    const allLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.organizationId, organizationId));

    // Get applications in date range
    const newApplications = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.organizationId, organizationId),
          gte(applications.createdAt, dateFrom),
          lte(applications.createdAt, dateTo),
          eq(applications.status, "NEW")
        )
      );

    const approvedApplications = await db
      .select()
      .from(applications)
      .where(
        and(
          eq(applications.organizationId, organizationId),
          eq(applications.status, "APPROVED")
        )
      );

    // Calculate statistics
    const totalLoans = allLoans.length;
    const totalVolume = allLoans.reduce((sum, loan) => sum + loan.amount, 0);
    
    // Calculate paid amount and overdue
    let totalPaid = 0;
    let overdueMoney = 0;

    for (const loan of allLoans) {
      const loanInstallments = await db
        .select()
        .from(installments)
        .where(eq(installments.loanId, loan.id));

      for (const inst of loanInstallments) {
        totalPaid += inst.paidAmount;
        if (inst.status === "OVERDUE") {
          overdueMoney += inst.totalAmount - inst.paidAmount;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          totalLoans,
          totalVolume,
          totalPaid,
          overdueMoney,
          newApplications: newApplications.length,
          approvedApplications: approvedApplications.length,
          dateFrom: dateFrom.toISOString(),
          dateTo: dateTo.toISOString(),
        },
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
    console.error("Error fetching report data:", error);

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
