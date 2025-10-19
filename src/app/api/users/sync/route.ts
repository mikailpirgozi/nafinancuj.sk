import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Sync Clerk user to database
 * Creates user and organization if they don't exist
 */
export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (existingUser) {
      return NextResponse.json({ 
        message: "User already synced",
        user: existingUser 
      });
    }

    // Get Clerk user details
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get or create organization
    let organization = await db.query.organizations.findFirst({
      where: eq(organizations.slug, "demo-finance"),
    });

    if (!organization) {
      // Create default organization
      [organization] = await db
        .insert(organizations)
        .values({
          name: "Demo Finance s.r.o.",
          slug: "demo-finance",
          settings: {
            defaultInterestRate: 12.5,
          },
        })
        .returning();
    }

    // Create user in database
    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        organizationId: organization.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
        role: "OWNER", // First user becomes OWNER
      })
      .returning();

    return NextResponse.json({
      message: "User synced successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}

