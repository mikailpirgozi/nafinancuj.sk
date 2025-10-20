import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { payments } from "@/db/schema/payments";
import { installments } from "@/db/schema/installments";
import { users } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const matchSchema = z.object({
  installmentId: z.string().min(1),
  loanId: z.string().min(1),
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

    const paymentId = params.id;

    // Get payment
    const payment = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = matchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { installmentId, loanId } = validation.data;

    // Get installment
    const inst = await db
      .select()
      .from(installments)
      .where(
        and(
          eq(installments.id, installmentId),
          eq(installments.loanId, loanId)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!inst) {
      return NextResponse.json(
        { error: "Installment not found or does not belong to this loan" },
        { status: 404 }
      );
    }

    // Calculate new paid amount
    const newPaidAmount = Math.min(
      inst.totalAmount,
      inst.paidAmount + payment.amount
    );

    // Determine new status
    let newStatus = "PARTIALLY_PAID";
    if (newPaidAmount >= inst.totalAmount) {
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
        paidAt: new Date().toISOString(),
      })
      .where(eq(installments.id, installmentId));

    // Update payment to mark it as matched
    const updatedPayment = await db
      .update(payments)
      .set({
        installmentId,
        status: "MATCHED",
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId))
      .returning()
      .then((rows) => rows[0]);

    return NextResponse.json({ data: updatedPayment });
  } catch (error) {
    console.error("Error matching payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

