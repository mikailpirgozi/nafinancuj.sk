import { getCompanyByICO } from "@/lib/services/finstat-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, context: { params: Promise<{ ico: string }> }) {
  try {
    const { ico } = await context.params;

    // Validate ICO format
    if (!ico || !/^\d{8}$/.test(ico)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ICO format. Must be 8 digits.",
        },
        { status: 400 }
      );
    }

    const companyData = await getCompanyByICO(ico);

    if (!companyData) {
      return NextResponse.json(
        {
          success: false,
          error: "Company not found in Finstat registry",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: companyData,
    });
  } catch (error) {
    console.error("Error in /api/finstat/[ico]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch company data",
      },
      { status: 500 }
    );
  }
}
