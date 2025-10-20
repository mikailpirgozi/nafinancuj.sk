import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { loans } from "@/db/schema/loans";
import { installments } from "@/db/schema/installments";
import { payments } from "@/db/schema/payments";
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

    // Get all payments for organization loans
    const allPayments =
      loanIds.length > 0
        ? await db
            .select()
            .from(payments)
            .where((col) => col.loanId.inArray(loanIds))
        : [];

    // Calculate monthly cash flow for next 12 months
    const cashFlow = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);

      const monthStartStr = monthStart.toISOString().split("T")[0];
      const monthEndStr = monthEnd.toISOString().split("T")[0];

      // Expected income from installments due in this month
      const expectedInstallments = allInstallments.filter(
        (inst) => inst.dueDate >= monthStartStr && inst.dueDate <= monthEndStr
      );
      const expectedIncome = expectedInstallments.reduce(
        (sum, inst) => sum + inst.totalAmount,
        0
      );

      // Actual payments received in this month
      const monthPayments = allPayments.filter(
        (payment) =>
          payment.paidAt >= monthStartStr && payment.paidAt <= monthEndStr
      );
      const actualIncome = monthPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      const difference = actualIncome - expectedIncome;
      const collectionRate =
        expectedIncome > 0
          ? Math.round((actualIncome / expectedIncome) * 100)
          : 0;

      cashFlow.push({
        month: monthStart.toLocaleDateString("sk-SK", {
          year: "numeric",
          month: "long",
        }),
        expected: expectedIncome / 100,
        actual: actualIncome / 100,
        difference: difference / 100,
        collectionRate,
      });
    }

    return NextResponse.json({ data: cashFlow });
  } catch (error) {
    console.error("Error fetching cash flow report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
