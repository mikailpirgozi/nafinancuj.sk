import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { loans } from "@/db/schema/loans";
import { users } from "@/db/schema/users";
import { contractTemplates } from "@/db/schema/contract-templates";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePDF } from "@/lib/services/pdf-generator";

const generateContractSchema = z.object({
  loanId: z.string().min(1),
  templateId: z.string().optional(),
});

export async function POST(request: Request) {
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

    const body = await request.json();
    const validation = generateContractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation error", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { loanId, templateId } = validation.data;

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

    // Get template (use provided or default)
    let template;
    if (templateId) {
      template = await db
        .select()
        .from(contractTemplates)
        .where(eq(contractTemplates.id, templateId))
        .limit(1)
        .then((rows) => rows[0]);
    } else {
      // Get default template for organization
      template = await db
        .select()
        .from(contractTemplates)
        .where(eq(contractTemplates.isDefault, true))
        .limit(1)
        .then((rows) => rows[0]);
    }

    if (!template) {
      return NextResponse.json(
        { error: "No contract template found" },
        { status: 404 }
      );
    }

    // Prepare template variables
    const contractData = {
      client_name: "Klient",
      loan_amount: (loan.amount / 100).toLocaleString("sk-SK"),
      loan_currency: "EUR",
      interest_rate: loan.interestRateAnnual,
      duration_months: loan.durationMonths,
      start_date: loan.startDate,
      end_date: loan.endDate,
      variable_symbol: loan.variableSymbol,
      organization_name: user.organizationId,
    };

    // Replace variables in template
    let htmlContent = template.content;
    Object.entries(contractData).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      htmlContent = htmlContent.replace(regex, String(value));
    });

    // Generate PDF
    const pdfBuffer = await generatePDF(htmlContent);

    // Create filename
    const filename = `contract-${loan.variableSymbol}-${Date.now()}.pdf`;

    // Return PDF for download
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating contract:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
