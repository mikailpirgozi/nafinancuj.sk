/**
 * Debug script to check data
 * Run with: pnpm tsx src/scripts/debug-data.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { users, loans, clients, organizations } from "../db/schema";
import { eq } from "drizzle-orm";

async function debug() {
  console.log("🔍 Debugging data...\n");

  try {
    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.email, "pirgozi1@gmail.com"),
    });

    if (!user) {
      console.error("❌ User not found!");
      process.exit(1);
    }

    console.log("✅ User found:");
    console.log(`   Email: ${user.email}`);
    console.log(`   Organization ID: ${user.organizationId}`);
    console.log(`   Role: ${user.role}\n`);

    if (!user.organizationId) {
      console.error("❌ User has no organization ID!");
      process.exit(1);
    }

    // Get organization
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, user.organizationId),
    });

    if (org) {
      console.log("✅ Organization:");
      console.log(`   Name: ${org.name}`);
      console.log(`   ID: ${org.id}\n`);
    }

    // Get all loans
    const allLoans = await db.select().from(loans);
    console.log(`📊 Total loans in DB: ${allLoans.length}`);

    if (allLoans.length > 0) {
      console.log("\nLoans by organization:");
      const loansByOrg = allLoans.reduce((acc, loan) => {
        acc[loan.organizationId] = (acc[loan.organizationId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      for (const [orgId, count] of Object.entries(loansByOrg)) {
        console.log(`   ${orgId}: ${count} loans`);
      }
    }

    // Get loans for user's organization
    const userLoans = await db
      .select()
      .from(loans)
      .where(eq(loans.organizationId, user.organizationId));

    console.log(`\n📊 Loans for your organization: ${userLoans.length}`);

    if (userLoans.length > 0) {
      console.log("\nYour loans:");
      userLoans.forEach((loan) => {
        console.log(`   - ${loan.variableSymbol}: €${loan.amount} (${loan.status})`);
      });
    }

    // Get all clients
    const allClients = await db.select().from(clients);
    console.log(`\n👥 Total clients in DB: ${allClients.length}`);

    // Get clients for user's organization
    const userClients = await db
      .select()
      .from(clients)
      .where(eq(clients.organizationId, user.organizationId));

    console.log(`👥 Clients for your organization: ${userClients.length}`);

    if (userClients.length > 0) {
      console.log("\nYour clients:");
      userClients.forEach((client) => {
        console.log(`   - ${client.companyName || client.contactPerson}`);
      });
    }

    console.log("\n✅ Debug complete!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }

  process.exit(0);
}

debug();

