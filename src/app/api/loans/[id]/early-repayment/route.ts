import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { loans } from "@/db/schema/loans";
import { installments } from "@/db/schema/installments";
import { payments } from "@/db/schema/payments";
import { users } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const earlyRepaymentSchema = z.object({
  amount: z.number().min(0),
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "CARD", "OTHER"]).default("BANK_TRANSFER"),
  notes: z.string().optional(),
});

export async function POST(
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

    const loanId = params.id;

    // Get loan
    const loan = await db
      .select()
      .from(loans)
      .where(eq(loans.id, loanId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = earlyRepaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { amount, paymentMethod, notes } = validation.data;

    // Get all installments for this loan
    const loanInstallments = await db
      .select()
      .from(installments)
      .where(eq(installments.loanId, loanId));

    // Create payment for early repayment
    const newPayment = await db
      .insert(payments)
      .values({
        loanId,
        amount: Math.round(amount * 100), // Store in cents
        paymentMethod,
        paidAt: new Date().toISOString().split("T")[0],
        notes: notes || "Predčasné splatenie úveru",
        status: "COMPLETED",
      })
      .returning()
      .then((rows) => rows[0]);

    if (!newPayment) {
      throw new Error("Failed to create payment");
    }

    // Update all unpaid/partially paid installments to PAID
    await db
      .update(installments)
      .set({ status: "PAID", paidAt: new Date().toISOString() })
      .where(
        and(
          eq(installments.loanId, loanId),
          (col) =>
            col.status.inArray(["UNPAID", "PARTIALLY_PAID"])
        )
      );

    // Update loan status to COMPLETED
    await db
      .update(loans)
      .set({ status: "COMPLETED", endDate: new Date().toISOString().split("T")[0] })
      .where(eq(loans.id, loanId));

    return NextResponse.json({ data: { paymentId: newPayment.id } }, { status: 201 });
  } catch (error) {
    console.error("Error processing early repayment:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
