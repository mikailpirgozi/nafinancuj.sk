import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { installments } from "@/db/schema/installments";
import { loans } from "@/db/schema/loans";
import { clients } from "@/db/schema/clients";
import { reminderPolicies } from "@/db/schema/reminder-policies";
import { reminders } from "@/db/schema/reminders";
import { users } from "@/db/schema/users";
import { sendReminderNotification } from "@/lib/services/notification-service";
import { eq, and, lt, not, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

interface ReminderDetail {
  installmentId: string;
  clientName: string;
  reminderType: "EMAIL" | "SMS";
  feeCharged: number;
  sent: boolean;
  error?: string;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    let organizationId: string | null = null;

    // Check authentication: either user auth or Cron auth
    if (authHeader === `Bearer ${cronSecret}`) {
      // Vercel Cron authentication - process all organizations
      organizationId = null;
    } else if (userId) {
      // User authentication - process only user's organization
      const user = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1)
        .then(rows => rows[0]);

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      organizationId = user.organizationId;
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all overdue installments
    const overdueInstallments = await db
      .select()
      .from(installments)
      .leftJoin(loans, eq(installments.loanId, loans.id))
      .leftJoin(clients, eq(loans.clientId, clients.id))
      .where(
        and(
          lt(installments.dueDate, today),
          inArray(installments.status, ["UNPAID", "PARTIALLY_PAID"]),
          organizationId ? eq(loans.organizationId, organizationId) : undefined
        )
      );

    const processedInstallments = new Set<string>();
    const detailedResults: ReminderDetail[] = [];
    let remindersSent = 0;
    let totalFeesCharged = 0;

    for (const record of overdueInstallments) {
      const installment = record.installments;
      const loan = record.loans;
      const client = record.clients;

      if (!installment || !loan || !client || processedInstallments.has(installment.id)) {
        continue;
      }

      processedInstallments.add(installment.id);

      // Calculate days overdue
      const daysOverdue = Math.floor(
        (today.getTime() - new Date(installment.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Find matching policies
      const matchingPolicies = await db
        .select()
        .from(reminderPolicies)
        .where(
          and(
            eq(reminderPolicies.organizationId, loan.organizationId),
            eq(reminderPolicies.daysAfterDue, daysOverdue)
          )
        );

      for (const policy of matchingPolicies) {
        try {
          // Check if reminder already sent for this installment and policy
          const existingReminder = await db
            .select()
            .from(reminders)
            .where(
              and(
                eq(reminders.installmentId, installment.id),
                eq(reminders.policyId, policy.id)
              )
            )
            .limit(1)
            .then(rows => rows[0]);

          if (existingReminder) {
            detailedResults.push({
              installmentId: installment.id,
              clientName: client.companyName || client.contactPerson,
              reminderType: policy.reminderType,
              feeCharged: 0,
              sent: false,
              error: "Reminder already sent",
            });
            continue;
          }

          // Calculate fee
          let feeAmount = 0;
          if (policy.feeType === "FIXED") {
            feeAmount = Math.round(parseFloat(policy.feeAmount) * 100);
          } else {
            feeAmount = Math.round(
              (installment.totalAmount * parseFloat(policy.feeAmount)) / 100
            );
          }

          // Replace template variables
          let message = policy.messageTemplate;
          message = message.replace(/{{client_name}}/g, client.companyName || client.contactPerson);
          message = message.replace(/{{loan_amount}}/g, (loan.amount / 100).toFixed(2));
          message = message.replace(
            /{{installment_amount}}/g,
            ((installment.totalAmount + feeAmount) / 100).toFixed(2)
          );
          message = message.replace(
            /{{due_date}}/g,
            new Date(installment.dueDate).toLocaleDateString("sk-SK")
          );
          message = message.replace(/{{days_overdue}}/g, String(daysOverdue));
          message = message.replace(/{{fee_amount}}/g, (feeAmount / 100).toFixed(2));
          message = message.replace(/{{variable_symbol}}/g, loan.variableSymbol);

          // Send notification
          const notificationContact = policy.reminderType === "EMAIL" ? client.email : client.phone;

          if (!notificationContact) {
            detailedResults.push({
              installmentId: installment.id,
              clientName: client.companyName || client.contactPerson,
              reminderType: policy.reminderType,
              feeCharged: feeAmount,
              sent: false,
              error: `No ${policy.reminderType === "EMAIL" ? "email" : "phone"} address available`,
            });
            continue;
          }

          const notificationResult = await sendReminderNotification(
            policy.reminderType,
            notificationContact,
            message
          );

          if (!notificationResult.success) {
            detailedResults.push({
              installmentId: installment.id,
              clientName: client.companyName || client.contactPerson,
              reminderType: policy.reminderType,
              feeCharged: feeAmount,
              sent: false,
              error: String(notificationResult.error),
            });
            continue;
          }

          // Update installment with fee
          await db
            .update(installments)
            .set({
              totalAmount: installment.totalAmount + feeAmount,
            })
            .where(eq(installments.id, installment.id));

          // Create reminder record
          await db.insert(reminders).values({
            installmentId: installment.id,
            policyId: policy.id,
            feeCharged: feeAmount,
          });

          remindersSent++;
          totalFeesCharged += feeAmount;

          detailedResults.push({
            installmentId: installment.id,
            clientName: client.companyName || client.contactPerson,
            reminderType: policy.reminderType,
            feeCharged: feeAmount,
            sent: true,
          });
        } catch (policyError) {
          console.error(`Error processing policy ${policy.id}:`, policyError);
          detailedResults.push({
            installmentId: installment.id,
            clientName: client.companyName || client.contactPerson,
            reminderType: policy.reminderType,
            feeCharged: 0,
            sent: false,
            error: String(policyError),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processedInstallments: processedInstallments.size,
        remindersSent,
        totalFeesCharged: (totalFeesCharged / 100).toFixed(2),
        details: detailedResults,
      },
    });
  } catch (error) {
    console.error("Error generating reminders:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

