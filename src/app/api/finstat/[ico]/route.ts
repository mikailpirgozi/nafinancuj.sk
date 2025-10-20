import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { fetchFinstatData } from "@/lib/services/finstat-api";

export async function GET(
  request: Request,
  { params }: { params: { ico: string } }
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

    const ico = params.ico.trim();

    // Validate ICO format (Slovak ICO is 8 digits)
    if (!/^\d{8}$/.test(ico)) {
      return NextResponse.json(
        { error: "Invalid ICO format. Must be 8 digits." },
        { status: 400 }
      );
    }

    // Fetch from Finstat API
    const finstatData = await fetchFinstatData(ico);

    if (!finstatData) {
      return NextResponse.json(
        { error: "Company not found in Finstat" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: finstatData });
  } catch (error) {
    console.error("Error fetching from Finstat:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
