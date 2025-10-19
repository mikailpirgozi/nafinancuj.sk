import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, loans, installments } from "@/db/schema";
import { requireOrganization } from "@/lib/auth";
import { importPaymentsCsvSchema } from "@/lib/validators";
import { eurosToCents } from "@/lib/utils";
import { eq } from "drizzle-orm";

/**
 * POST /api/payments/import-csv
 * Import payments from CSV (Tatra banka format)
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await requireOrganization();
    const body = await request.json();

    // Validate input
    const { csvData } = importPaymentsCsvSchema.parse(body);

    // Parse CSV (simple implementation - can be enhanced)
    const lines = csvData.trim().split("\n");
    const imported: Array<{ success: boolean; variableSymbol: string; error?: string }> = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(";"); // Tatra banka uses semicolon
      
      // Expected format: Date;Amount;VS;Description
      if (columns.length < 3) {
        imported.push({
          success: false,
          variableSymbol: "N/A",
          error: "Invalid CSV format",
        });
        continue;
      }

      const [dateStr, amountStr, variableSymbol] = columns;
      
      try {
        // Parse amount (remove spaces, replace comma with dot)
        const amount = parseFloat(
          amountStr.replace(/\s/g, "").replace(",", ".")
        );
        const amountCents = eurosToCents(amount);

        // Find loan by variable symbol
        const loan = await db.query.loans.findFirst({
          where: eq(loans.variableSymbol, variableSymbol.trim()),
        });

        if (!loan || loan.organizationId !== organizationId) {
          imported.push({
            success: false,
            variableSymbol: variableSymbol.trim(),
            error: "Loan not found",
          });
          continue;
        }

        // Find oldest unpaid installment
        const unpaidInstallment = await db.query.installments.findFirst({
          where: eq(installments.loanId, loan.id),
          orderBy: (installments, { asc }) => [asc(installments.dueDate)],
        });

        // Create payment
        await db.insert(payments).values({
          loanId: loan.id,
          installmentId: unpaidInstallment?.id,
          amount: amountCents,
          paymentMethod: "BANK_TRANSFER",
          variableSymbol: variableSymbol.trim(),
          paidAt: new Date(dateStr),
          notes: "Imported from CSV",
        });

        // Update installment if found
        if (unpaidInstallment) {
          const newPaidAmount = unpaidInstallment.paidAmount + amountCents;
          const newStatus =
            newPaidAmount >= unpaidInstallment.totalAmount
              ? "PAID"
              : "PARTIALLY_PAID";

          await db
            .update(installments)
            .set({
              paidAmount: newPaidAmount,
              status: newStatus as never,
              paidAt: newStatus === "PAID" ? new Date() : null,
              updatedAt: new Date(),
            })
            .where(eq(installments.id, unpaidInstallment.id));
        }

        imported.push({
          success: true,
          variableSymbol: variableSymbol.trim(),
        });
      } catch (error) {
        imported.push({
          success: false,
          variableSymbol: variableSymbol.trim(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = imported.filter((r) => r.success).length;
    const failCount = imported.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Import dokončený: ${successCount} úspešných, ${failCount} neúspešných`,
      data: {
        total: imported.length,
        successful: successCount,
        failed: failCount,
        details: imported,
      },
    });
  } catch (error) {
    console.error("Error importing CSV:", error);

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

