import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { loans } from "@/db/schema/loans";
import { installments } from "@/db/schema/installments";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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

    // Get all loans for organization
    const orgLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.organizationId, user.organizationId));

    const loanIds = orgLoans.map((loan) => loan.id);

    // Get all installments for organization loans
    const allInstallments =
      loanIds.length > 0
        ? await db
            .select()
            .from(installments)
            .where((col) => col.loanId.inArray(loanIds))
        : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split("T")[0];

    // Calculate total portfolio value
    const totalPortfolioVolume = orgLoans.reduce(
      (sum, loan) => sum + loan.amount,
      0
    );

    // Portfolio by status
    const byStatus = {
      ACTIVE: { count: 0, volume: 0 },
      COMPLETED: { count: 0, volume: 0 },
      LATE: { count: 0, volume: 0 },
    };

    for (const loan of orgLoans) {
      const status = (loan.status as keyof typeof byStatus) || "ACTIVE";
      byStatus[status].count += 1;
      byStatus[status].volume += loan.amount;
    }

    // Portfolio by product type
    const byProductType: Record<string, { count: number; volume: number }> = {};
    for (const loan of orgLoans) {
      const productType = loan.productType || "OTHER";
      if (!byProductType[productType]) {
        byProductType[productType] = { count: 0, volume: 0 };
      }
      byProductType[productType].count += 1;
      byProductType[productType].volume += loan.amount;
    }

    // Risk classification
    // Low risk: <2% overdue, Medium risk: 2-10% overdue, High risk: >10% overdue
    const riskAnalysis = {
      low: { count: 0, volume: 0 },
      medium: { count: 0, volume: 0 },
      high: { count: 0, volume: 0 },
    };

    for (const loan of orgLoans) {
      const loanInstallments = allInstallments.filter(
        (inst) => inst.loanId === loan.id
      );
      const totalAmount = loanInstallments.reduce(
        (sum, inst) => sum + inst.totalAmount,
        0
      );
      const overdueAmount = loanInstallments
        .filter((inst) => inst.dueDate < todayString && inst.status !== "PAID")
        .reduce((sum, inst) => sum + (inst.totalAmount - inst.paidAmount), 0);

      const overduePercentage =
        totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0;

      let risk = "low";
      if (overduePercentage > 10) {
        risk = "high";
      } else if (overduePercentage > 2) {
        risk = "medium";
      }

      riskAnalysis[risk as keyof typeof riskAnalysis].count += 1;
      riskAnalysis[risk as keyof typeof riskAnalysis].volume += loan.amount;
    }

    return NextResponse.json({
      data: {
        totalVolume: totalPortfolioVolume / 100,
        byStatus: {
          active: {
            count: byStatus.ACTIVE.count,
            volume: byStatus.ACTIVE.volume / 100,
            percentage:
              totalPortfolioVolume > 0
                ? Math.round((byStatus.ACTIVE.volume / totalPortfolioVolume) * 100)
                : 0,
          },
          completed: {
            count: byStatus.COMPLETED.count,
            volume: byStatus.COMPLETED.volume / 100,
            percentage:
              totalPortfolioVolume > 0
                ? Math.round(
                    (byStatus.COMPLETED.volume / totalPortfolioVolume) * 100
                  )
                : 0,
          },
          late: {
            count: byStatus.LATE.count,
            volume: byStatus.LATE.volume / 100,
            percentage:
              totalPortfolioVolume > 0
                ? Math.round((byStatus.LATE.volume / totalPortfolioVolume) * 100)
                : 0,
          },
        },
        byProductType: Object.entries(byProductType).map(([type, data]) => ({
          type,
          count: data.count,
          volume: data.volume / 100,
          percentage:
            totalPortfolioVolume > 0
              ? Math.round((data.volume / totalPortfolioVolume) * 100)
              : 0,
        })),
        riskAnalysis: {
          low: {
            count: riskAnalysis.low.count,
            volume: riskAnalysis.low.volume / 100,
            percentage:
              totalPortfolioVolume > 0
                ? Math.round((riskAnalysis.low.volume / totalPortfolioVolume) * 100)
                : 0,
          },
          medium: {
            count: riskAnalysis.medium.count,
            volume: riskAnalysis.medium.volume / 100,
            percentage:
              totalPortfolioVolume > 0
                ? Math.round(
                    (riskAnalysis.medium.volume / totalPortfolioVolume) * 100
                  )
                : 0,
          },
          high: {
            count: riskAnalysis.high.count,
            volume: riskAnalysis.high.volume / 100,
            percentage:
              totalPortfolioVolume > 0
                ? Math.round((riskAnalysis.high.volume / totalPortfolioVolume) * 100)
                : 0,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching portfolio report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
