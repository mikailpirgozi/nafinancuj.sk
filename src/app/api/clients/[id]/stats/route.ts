import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { clients } from "@/db/schema/clients";
import { loans } from "@/db/schema/loans";
import { installments } from "@/db/schema/installments";
import { users } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const clientId = params.id;

    // Verify client belongs to organization
    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Get all loans for client
    const clientLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.clientId, clientId));

    const loanIds = clientLoans.map((loan) => loan.id);

    // Get installments for all client loans
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

    // Calculate stats
    const totalLoans = clientLoans.length;
    const activeLoans = clientLoans.filter(
      (loan) => loan.status === "ACTIVE"
    ).length;
    const completedLoans = clientLoans.filter(
      (loan) => loan.status === "COMPLETED"
    ).length;

    const totalVolume = clientLoans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalPaid = allInstallments.reduce(
      (sum, inst) => sum + inst.paidAmount,
      0
    );

    const overdueInstallments = allInstallments.filter(
      (inst) => inst.dueDate < todayString && inst.status !== "PAID"
    );
    const overdueAmount = overdueInstallments.reduce(
      (sum, inst) => sum + (inst.totalAmount - inst.paidAmount),
      0
    );

    return NextResponse.json({
      data: {
        totalLoans,
        activeLoans,
        completedLoans,
        totalVolume,
        totalPaid,
        overdueInstallments: overdueInstallments.length,
        overdueAmount,
      },
    });
  } catch (error) {
    console.error("Error fetching client stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
