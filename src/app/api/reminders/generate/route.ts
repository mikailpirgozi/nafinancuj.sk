import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { installments, reminders, reminderPolicies } from "@/db/schema";
import { eq, and, lt, or } from "drizzle-orm";

/**
 * POST /api/reminders/generate
 * Generate and send reminders for overdue installments
 * Can be triggered manually or via Vercel Cron
 */
export async function POST(req: NextRequest) {
  try {
    // Check for cron secret or user auth
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    let organizationId: string | null = null;

    if (authHeader === `Bearer ${cronSecret}`) {
      // Cron job - process all organizations
      console.log("Running reminder generation via cron");
    } else {
      // Manual trigger - check user auth
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
      });

      if (!user?.organizationId) {
        return NextResponse.json(
          { error: "User not associated with organization" },
          { status: 403 }
        );
      }

      // Only ADMIN, OWNER, SUPER_ADMIN can trigger manually
      if (!["ADMIN", "OWNER", "SUPER_ADMIN"].includes(user.role)) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }

      organizationId = user.organizationId;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.toISOString().split("T")[0];

    // Get all overdue installments
    const overdueInstallments = await db.query.installments.findMany({
      where: and(
        lt(installments.dueDate, todayString),
        or(
          eq(installments.status, "UNPAID"),
          eq(installments.status, "PARTIALLY_PAID")
        )
      ),
      with: {
        loan: {
          with: {
            client: true,
            organization: true,
          },
        },
      },
    });

    let remindersGenerated = 0;
    let totalFeesCharged = 0;

    for (const installment of overdueInstallments) {
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(installment.dueDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Get applicable reminder policies for this organization
      const policies = await db.query.reminderPolicies.findMany({
        where: and(
          eq(reminderPolicies.organizationId, installment.loan.organizationId),
          eq(reminderPolicies.daysAfterDue, daysOverdue)
        ),
      });

      for (const policy of policies) {
        // Check if reminder already sent for this installment and policy
        const existingReminder = await db.query.reminders.findFirst({
          where: and(
            eq(reminders.installmentId, installment.id),
            eq(reminders.policyId, policy.id)
          ),
        });

        if (existingReminder) {
          continue; // Skip if already sent
        }

        // Calculate fee
        let feeAmount = 0;
        if (policy.feeType === "FIXED") {
          feeAmount = Number(policy.feeAmount);
        } else if (policy.feeType === "PERCENTAGE") {
          const remainingAmount =
            Number(installment.totalAmount) - Number(installment.paidAmount);
          feeAmount = (remainingAmount * Number(policy.feeAmount)) / 100;
        }

        // Create reminder record
        await db.insert(reminders).values({
          installmentId: installment.id,
          policyId: policy.id,
          sentAt: new Date(),
          feeCharged: feeAmount.toString(),
        });

        // Update installment with fee (add to total_amount)
        if (feeAmount > 0) {
          await db
            .update(installments)
            .set({
              totalAmount: (
                Number(installment.totalAmount) + feeAmount
              ).toString(),
            })
            .where(eq(installments.id, installment.id));

          totalFeesCharged += feeAmount;
        }

        // Send notification (email or SMS)
        await sendReminderNotification(
          policy.reminderType,
          installment,
          policy.messageTemplate,
          feeAmount
        );

        remindersGenerated++;
      }
    }

    return NextResponse.json({
      success: true,
      remindersGenerated,
      totalFeesCharged: totalFeesCharged.toFixed(2),
      overdueInstallmentsProcessed: overdueInstallments.length,
    });
  } catch (error) {
    console.error("Error generating reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Send reminder notification via email or SMS
 */
async function sendReminderNotification(
  type: "EMAIL" | "SMS",
  installment: any,
  template: string,
  feeAmount: number
) {
  const { sendReminderNotification: sendNotification } = await import(
    "@/lib/services/notification-service"
  );

  const client = installment.loan.client;
  const loan = installment.loan;

  // Replace template variables
  const message = template
    .replace(/\{\{client_name\}\}/g, client.companyName || client.contactPerson)
    .replace(/\{\{loan_amount\}\}/g, loan.amount)
    .replace(/\{\{installment_amount\}\}/g, installment.totalAmount)
    .replace(
      /\{\{due_date\}\}/g,
      new Date(installment.dueDate).toLocaleDateString("sk-SK")
    )
    .replace(/\{\{fee_amount\}\}/g, feeAmount.toFixed(2))
    .replace(/\{\{variable_symbol\}\}/g, loan.variableSymbol || "");

  const recipient = type === "EMAIL" ? client.email : client.phone;

  if (!recipient) {
    console.warn(
      `No ${type === "EMAIL" ? "email" : "phone"} for client ${client.id}`
    );
    return;
  }

  await sendNotification(type, recipient, message);
}

