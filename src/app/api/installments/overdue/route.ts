import { NextResponse } from "next/server";
import { db } from "@/db";
import { installments, loans, clients, payments, reminders } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/installments/overdue
 * Get all overdue installments with their loan and client info in one efficient query
 */
export async function GET() {
  try {
    const { organizationId } = await requireOrganization();

    // Efficient single query with joins
    const overdueInstallments = await db
      .select()
      .from(installments)
      .innerJoin(loans, eq(installments.loanId, loans.id))
      .innerJoin(clients, eq(loans.clientId, clients.id))
      .where(and(
        eq(installments.status, "OVERDUE"),
        eq(loans.organizationId, organizationId)
      ));

    // Get payments and reminders for each installment
    const result = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      overdueInstallments.map(async (row: Record<string, any>) => {
        const dueDate = new Date(row.installments.dueDate);
        const today = new Date();
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        // Get payments for this installment
        const installmentPayments = await db
          .select()
          .from(payments)
          .where(eq(payments.installmentId, row.installments.id))
          .orderBy(payments.paidAt);

        // Get reminders for this installment
        const installmentReminders = await db.query.reminders.findMany({
          where: eq(reminders.installmentId, row.installments.id),
          with: {
            policy: true,
          },
          orderBy: (reminders, { asc }) => [asc(reminders.sentAt)],
        });

        return {
          id: row.installments.id,
          dueDate: row.installments.dueDate,
          totalAmount: row.installments.totalAmount,
          paidAmount: row.installments.paidAmount,
          status: row.installments.status,
          paidAt: row.installments.paidAt,
          loanId: row.installments.loanId,
          daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
          remindersSent: installmentReminders.length,
          loan: {
            id: row.loans.id,
            variableSymbol: row.loans.variableSymbol,
            interestRateAnnual: row.loans.interestRateAnnual,
          },
          client: {
            id: row.clients.id,
            companyName: row.clients.companyName,
            contactPerson: row.clients.contactPerson,
            email: row.clients.email,
            phone: row.clients.phone,
          },
          payments: installmentPayments,
          reminders: installmentReminders,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching overdue installments:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      {
        status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500,
      }
    );
  }
}
