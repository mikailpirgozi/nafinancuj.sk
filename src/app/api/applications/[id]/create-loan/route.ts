import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { applications } from "@/db/schema/applications";
import { loans } from "@/db/schema/loans";
import { installments } from "@/db/schema/installments";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateInstallments } from "@/lib/services/loan-calculator";
import crypto from "crypto";

const createLoanSchema = z.object({
  amount: z.number().min(100).max(10000000),
  durationMonths: z.number().min(1).max(360),
  purpose: z.string().optional(),
  interestRateAnnual: z.string().default("5.0"),
  productType: z.string().default("DEFAULT"),
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

    const applicationId = params.id;

    // Get and verify application
    const app = await db
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1)
      .then((rows) => rows[0]);

    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check if application is approved
    if (app.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Application must be APPROVED to create loan" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = createLoanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      amount,
      durationMonths,
      purpose,
      interestRateAnnual,
      productType,
    } = validation.data;

    // Generate unique variable symbol (loan ID)
    const variableSymbol = crypto
      .randomBytes(6)
      .toString("hex")
      .toUpperCase()
      .slice(0, 12);

    // Create loan record
    const newLoan = await db
      .insert(loans)
      .values({
        clientId: app.clientId,
        organizationId: user.organizationId,
        variableSymbol,
        amount: Math.round(amount * 100), // Store in cents
        interestRateAnnual,
        interestRateMonthly: (parseFloat(interestRateAnnual) / 12).toFixed(4),
        productType,
        durationMonths,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status: "ACTIVE",
      })
      .returning()
      .then((rows) => rows[0]);

    if (!newLoan) {
      throw new Error("Failed to create loan");
    }

    // Generate installments
    const installmentRecords = generateInstallments({
      loanAmount: amount,
      annualRate: parseFloat(interestRateAnnual),
      durationMonths,
      startDate: new Date(),
    });

    // Insert installments
    if (installmentRecords.length > 0) {
      await db.insert(installments).values(
        installmentRecords.map((inst, index) => ({
          loanId: newLoan.id,
          installmentNumber: index + 1,
          dueDate: inst.dueDate.toISOString().split("T")[0],
          principalAmount: Math.round(inst.principalAmount * 100),
          interestAmount: Math.round(inst.interestAmount * 100),
          totalAmount: Math.round((inst.principalAmount + inst.interestAmount) * 100),
          paidAmount: 0,
          status: "UNPAID",
        }))
      );
    }

    // Update application status to CONVERTED
    await db
      .update(applications)
      .set({ status: "CONVERTED" })
      .where(eq(applications.id, applicationId));

    return NextResponse.json({ data: { id: newLoan.id } }, { status: 201 });
  } catch (error) {
    console.error("Error creating loan from application:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
