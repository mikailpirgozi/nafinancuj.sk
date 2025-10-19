import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { loans, installments } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { createLoanSchema } from "@/lib/validators";
import {
  generateVariableSymbol,
  generateAmortizingSchedule,
  generateInterestOnlySchedule,
  annualToMonthlyRate,
} from "@/lib/services/loan-calculator";
import { eq, desc, and } from "drizzle-orm";

/**
 * GET /api/loans
 * Get all loans for the current organization
 */
export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const conditions = [eq(loans.organizationId, organizationId)];

    if (status) {
      conditions.push(eq(loans.status, status as never));
    }

    const result = await db
      .select()
      .from(loans)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(loans.createdAt));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching loans:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

/**
 * POST /api/loans
 * Create a new loan and generate installment schedule
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const body = await request.json();

    // Validate input
    const validatedData = createLoanSchema.parse({
      ...body,
      organizationId,
    });

    // Generate unique variable symbol
    const variableSymbol = generateVariableSymbol();

    // Create loan
    const [loan] = await db
      .insert(loans)
      .values({
        ...validatedData,
        variableSymbol,
        status: "PENDING",
      })
      .returning();

    // Generate installment schedule
    const monthlyRate = annualToMonthlyRate(
      parseFloat(validatedData.interestRateAnnual)
    );

    const schedule =
      validatedData.productType === "AMORTIZING"
        ? generateAmortizingSchedule(
            validatedData.amount,
            monthlyRate,
            validatedData.durationMonths,
            new Date(validatedData.startDate)
          )
        : generateInterestOnlySchedule(
            validatedData.amount,
            monthlyRate,
            validatedData.durationMonths,
            new Date(validatedData.startDate)
          );

    // Insert installments
    const installmentRecords = schedule.map((inst) => ({
      loanId: loan.id,
      dueDate: inst.dueDate.toISOString().split("T")[0], // Convert to YYYY-MM-DD
      principalAmount: inst.principalAmount,
      interestAmount: inst.interestAmount,
      totalAmount: inst.totalAmount,
      paidAmount: 0,
      status: "UNPAID" as const,
    }));

    await db.insert(installments).values(installmentRecords);

    // Update loan status to ACTIVE
    await db
      .update(loans)
      .set({ status: "ACTIVE" })
      .where(eq(loans.id, loan.id));

    return NextResponse.json(
      {
        success: true,
        data: {
          ...loan,
          status: "ACTIVE",
          installmentsCount: schedule.length,
        },
        message: "Úver bol úspešne vytvorený",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating loan:", error);

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
      { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 500 }
    );
  }
}

