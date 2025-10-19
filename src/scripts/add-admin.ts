/**
 * Add admin user script
 * Run with: pnpm tsx src/scripts/add-admin.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { organizations, users } from "../db/schema";
import { eq } from "drizzle-orm";

async function addAdmin() {
  console.log("🔧 Adding admin user...");

  try {
    // Get the demo organization
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, "demo-finance"),
    });

    if (!org) {
      console.error("❌ Organization not found. Run seed script first.");
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, "pirgozi1@gmail.com"),
    });

    if (existingUser) {
      console.log("✅ User already exists, updating to ADMIN...");
      await db
        .update(users)
        .set({ role: "ADMIN" })
        .where(eq(users.email, "pirgozi1@gmail.com"));
      console.log("✅ User updated to ADMIN!");
    } else {
      console.log("❌ User not found in database.");
      console.log("Please log in first at http://localhost:3000/sign-in");
      console.log("Then run this script again.");
    }

    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Failed:", error);
    throw error;
  }
}

addAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

