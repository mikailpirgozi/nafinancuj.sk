import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { loans } from "@/db/schema/loans";
import { clients } from "@/db/schema/clients";
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

    // Group by client
    const clientStats: Record<
      string,
      {
        clientId: string;
        clientName: string;
        loanCount: number;
        volume: number;
        paid: number;
        overdue: number;
      }
    > = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split("T")[0];

    for (const loan of orgLoans) {
      if (!clientStats[loan.clientId]) {
        clientStats[loan.clientId] = {
          clientId: loan.clientId,
          clientName: "", // Will be filled later
          loanCount: 0,
          volume: 0,
          paid: 0,
          overdue: 0,
        };
      }

      clientStats[loan.clientId].loanCount += 1;
      clientStats[loan.clientId].volume += loan.amount;

      const loanInstallments = allInstallments.filter(
        (inst) => inst.loanId === loan.id
      );
      const paid = loanInstallments.reduce(
        (sum, inst) => sum + inst.paidAmount,
        0
      );
      const overdue = loanInstallments
        .filter((inst) => inst.dueDate < todayString && inst.status !== "PAID")
        .reduce((sum, inst) => sum + (inst.totalAmount - inst.paidAmount), 0);

      clientStats[loan.clientId].paid += paid;
      clientStats[loan.clientId].overdue += overdue;
    }

    // Get client names
    const clientIds = Object.keys(clientStats);
    const allClients =
      clientIds.length > 0
        ? await db
            .select()
            .from(clients)
            .where((col) => col.id.inArray(clientIds))
        : [];

    for (const client of allClients) {
      if (clientStats[client.id]) {
        clientStats[client.id].clientName =
          client.companyName || client.contactPerson;
      }
    }

    // Convert to array and sort by volume
    const topClients = Object.values(clientStats)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10)
      .map((stats, index) => ({
        rank: index + 1,
        clientName: stats.clientName,
        loanCount: stats.loanCount,
        volume: stats.volume / 100,
        paid: stats.paid / 100,
        overdue: stats.overdue / 100,
        paymentRate:
          stats.volume > 0
            ? Math.round((stats.paid / stats.volume) * 100)
            : 0,
      }));

    return NextResponse.json({ data: topClients });
  } catch (error) {
    console.error("Error fetching top clients report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
