/**
 * Assign demo data to user's organization
 * Run with: pnpm tsx src/scripts/assign-demo-data.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { users, clients, loans } from "../db/schema";
import { eq } from "drizzle-orm";

async function assignDemoData() {
  console.log("🔧 Assigning demo data to your organization...");

  try {
    // Get your user
    const user = await db.query.users.findFirst({
      where: eq(users.email, "pirgozi1@gmail.com"),
    });

    if (!user) {
      console.error("❌ User not found. Please log in first.");
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.email}`);
    console.log(`   Organization ID: ${user.organizationId}`);
    console.log(`   Role: ${user.role}`);

    if (!user.organizationId) {
      console.error("❌ User has no organization ID. Please set up organization first.");
      process.exit(1);
    }

    // Update all clients to your organization
    const updatedClients = await db
      .update(clients)
      .set({ organizationId: user.organizationId })
      .returning();

    console.log(`✅ Updated ${updatedClients.length} clients`);

    // Update all loans to your organization
    const updatedLoans = await db
      .update(loans)
      .set({ organizationId: user.organizationId })
      .returning();

    console.log(`✅ Updated ${updatedLoans.length} loans`);

    console.log("\n🎉 Demo data assigned successfully!");
    console.log("Refresh your dashboard to see the data.");
  } catch (error) {
    console.error("❌ Failed:", error);
    throw error;
  }
}

assignDemoData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

