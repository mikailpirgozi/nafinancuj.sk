import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, installments, loans } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { createPaymentSchema } from "@/lib/validators";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/payments
 * Get all payments for the current organization
 */
export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();

    const searchParams = request.nextUrl.searchParams;
    const loanId = searchParams.get("loanId");

    // Build where conditions
    const conditions = [eq(loans.organizationId, organizationId)];

    if (loanId) {
      conditions.push(eq(payments.loanId, loanId));
    }

    // Get payments with loan info
    const result = await db
      .select({
        payment: payments,
        loan: loans,
      })
      .from(payments)
      .innerJoin(loans, eq(payments.loanId, loans.id))
      .where(and(...conditions))
      .orderBy(desc(payments.paidAt));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);

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
 * POST /api/payments
 * Create a new payment and update installment status
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const body = await request.json();

    // Validate input
    const validatedData = createPaymentSchema.parse(body);

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

    // Create payment (convert paidAt string to Date)
    const [payment] = await db
      .insert(payments)
      .values({
        ...validatedData,
        paidAt: new Date(validatedData.paidAt),
      })
      .returning();

    // If installment is specified, update its paid amount
    if (validatedData.installmentId) {
      const installment = await db.query.installments.findFirst({
        where: eq(installments.id, validatedData.installmentId),
      });

      if (installment) {
        const newPaidAmount = installment.paidAmount + validatedData.amount;
        const totalDue = installment.totalAmount;

        // Determine new status
        let newStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" =
          installment.status;

        if (newPaidAmount >= totalDue) {
          newStatus = "PAID";
        } else if (newPaidAmount > 0) {
          newStatus = "PARTIALLY_PAID";
        }

        // Update installment
        await db
          .update(installments)
          .set({
            paidAmount: newPaidAmount,
            status: newStatus,
            paidAt: newStatus === "PAID" ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(eq(installments.id, validatedData.installmentId));
      }
    }

    // Check if all installments are paid and update loan status
    const loanInstallments = await db
      .select()
      .from(installments)
      .where(eq(installments.loanId, validatedData.loanId));

    const allPaid = loanInstallments.every((inst) => inst.status === "PAID");
    const hasOverdue = loanInstallments.some((inst) => inst.status === "OVERDUE");

    if (allPaid) {
      await db
        .update(loans)
        .set({ status: "CLOSED", updatedAt: new Date() })
        .where(eq(loans.id, validatedData.loanId));
    } else if (hasOverdue && loan.status !== "LATE") {
      await db
        .update(loans)
        .set({ status: "LATE", updatedAt: new Date() })
        .where(eq(loans.id, validatedData.loanId));
    }

    return NextResponse.json(
      {
        success: true,
        data: payment,
        message: "Platba bola úspešne zaznamenaná",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payment:", error);

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

