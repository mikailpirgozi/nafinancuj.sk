import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { applications, clients } from "@/db/schema";
import { createApplicationSchema } from "@/lib/validators";
import { eurosToCents } from "@/lib/utils";
import { eq } from "drizzle-orm";

/**
 * POST /api/public/applications
 * Public endpoint for receiving loan applications from the website
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createApplicationSchema.parse({
      ...body,
      amount: eurosToCents(body.amount), // Convert EUR to cents
      collateralValue: body.collateralValue
        ? eurosToCents(body.collateralValue)
        : undefined,
    });

    // Check if client exists, if not create new client
    let client = await db.query.clients.findFirst({
      where: eq(clients.ico, body.clientIco),
    });

    if (!client) {
      // Create new client
      const [newClient] = await db
        .insert(clients)
        .values({
          organizationId: validatedData.organizationId,
          companyName: body.clientCompanyName,
          ico: body.clientIco,
          contactPerson: body.clientContactPerson,
          email: body.clientEmail,
          phone: body.clientPhone,
        })
        .returning();

      client = newClient;
    }

    // Create application
    const [application] = await db
      .insert(applications)
      .values({
        ...validatedData,
        clientId: client.id,
        status: "NEW",
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: application,
        message: "Žiadosť bola úspešne odoslaná",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating application:", error);

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
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

