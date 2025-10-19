import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contractTemplates, loans, documents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { contractGenerateSchema } from "@/lib/validators/contract-template";
import { generateLoanAgreementPDF } from "@/lib/services/pdf-generator";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = contractGenerateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    // Get user's organization
    const user = await db
      .select()
      .from("users")
      .where(eq("users.clerkId", userId))
      .limit(1)
      .execute();

    if (!user || user.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const organizationId = (user[0] as any).organizationId;

    // Fetch template
    const template = await db
      .select()
      .from(contractTemplates)
      .where(
        and(
          eq(contractTemplates.id, validation.data.templateId),
          eq(contractTemplates.organizationId, organizationId)
        )
      )
      .limit(1)
      .execute();

    if (!template || template.length === 0) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Fetch loan with related data
    const loan = await db
      .select()
      .from(loans)
      .where(eq(loans.id, validation.data.loanId))
      .limit(1)
      .execute();

    if (!loan || loan.length === 0) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 });
    }

    const loanData = loan[0] as any;

    // Prepare variables for PDF generation
    const pdfVariables = {
      client_name: validation.data.variables?.client_name || "Dlžník",
      client_ico: validation.data.variables?.client_ico || "",
      loan_amount: validation.data.variables?.loan_amount || String(loanData.amount / 100),
      interest_rate: validation.data.variables?.interest_rate || loanData.interestRateAnnual,
      duration_months: validation.data.variables?.duration_months || loanData.durationMonths,
      start_date: validation.data.variables?.start_date || loanData.startDate,
      end_date: validation.data.variables?.end_date || loanData.endDate,
      variable_symbol: validation.data.variables?.variable_symbol || loanData.variableSymbol,
    };

    // Generate PDF
    const pdfBlob = await generateLoanAgreementPDF({
      templateContent: template[0].templateContent,
      variables: pdfVariables,
      loanData: {
        variableSymbol: loanData.variableSymbol,
      },
    });

    // Upload to Supabase Storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const fileName = `contracts/${loanData.id}/${Date.now()}-contract.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, pdfBlob, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload PDF" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    // Create document record in database
    const documentResult = await db
      .insert(documents)
      .values({
        loanId: validation.data.loanId,
        organizationId,
        name: `Contract - ${template[0].name}`,
        type: "contract",
        fileSize: pdfBlob.size,
        storagePath: fileName,
        downloadUrl: publicData.publicUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        documentId: documentResult[0]?.id,
        downloadUrl: publicData.publicUrl,
        fileName,
      },
    });
  } catch (error) {
    console.error("Error generating contract:", error);
    return NextResponse.json(
      { error: "Failed to generate contract" },
      { status: 500 }
    );
  }
}
