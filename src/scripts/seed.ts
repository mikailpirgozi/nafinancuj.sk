/**
 * Seed script for demo data with 50+ records
 * Run with: pnpm tsx src/scripts/seed.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import {
  organizations,
  users,
  clients,
  loans,
  installments,
  applications,
  payments,
  documents,
  collaterals,
  reminderPolicies,
  reminders,
  contractTemplates,
} from "../db/schema";
import { eq } from "drizzle-orm";

// Helper to generate random dates
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper to generate random amount
function randomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min) * 100; // in cents
}

// Slovak company names
const companyNames = [
  "ABC Trading s.r.o.",
  "XYZ Services s.r.o.",
  "Best Solutions s.r.o.",
  "Tech Innovations s.r.o.",
  "Green Energy s.r.o.",
  "Smart Logistics s.r.o.",
  "Digital Marketing Pro s.r.o.",
  "Construction Plus s.r.o.",
  "Food & Beverage s.r.o.",
  "Auto Parts Slovakia s.r.o.",
  "Fashion Retail s.r.o.",
  "IT Consulting Group s.r.o.",
  "Medical Equipment s.r.o.",
  "Real Estate Invest s.r.o.",
  "Tourism Services s.r.o.",
  "Manufacturing Pro s.r.o.",
  "Export Import SK s.r.o.",
  "Cleaning Services s.r.o.",
  "Security Systems s.r.o.",
  "Education Center s.r.o.",
  "Fitness & Wellness s.r.o.",
  "Restaurant Group s.r.o.",
  "Transport Solutions s.r.o.",
  "Printing House s.r.o.",
  "Software Development s.r.o.",
  "Agriculture Tech s.r.o.",
  "Pharmacy Chain s.r.o.",
  "Beauty Salon Network s.r.o.",
  "Legal Services s.r.o.",
  "Accounting Firm s.r.o.",
];

const firstNames = ["Ján", "Peter", "Mária", "Anna", "Michal", "Eva", "Martin", "Katarína", "Tomáš", "Zuzana"];
const lastNames = ["Novák", "Horváth", "Kováč", "Varga", "Tóth", "Nagy", "Molnár", "Szabó", "Kiss", "Baláž"];

async function seed() {
  console.log("🌱 Starting comprehensive seed...");

  try {
    // 0. Clean existing demo data (optional - comment out to keep existing data)
    console.log("Cleaning existing demo data...");
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.slug, "demo-finance"),
    });

    if (existingOrg) {
      // Delete will cascade to all related tables
      await db.delete(organizations).where(eq(organizations.id, existingOrg.id));
      console.log("✅ Cleaned existing demo data");
    }

    // 1. Get or create demo organization
    console.log("Getting or creating demo organization...");
    let org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, "demo-finance"),
    });

    if (!org) {
      [org] = await db
        .insert(organizations)
        .values({
          name: "Demo Finance s.r.o.",
          slug: "demo-finance",
          settings: {
            defaultInterestRate: 12.5,
            currency: "EUR",
            locale: "sk-SK",
          },
        })
        .returning();
      console.log(`✅ Created organization: ${org.name}`);
    } else {
      console.log(`✅ Using existing organization: ${org.name}`);
    }

    // 2. Create demo users
    console.log("Creating demo users...");
    const demoUsers = [
      {
        id: "demo-admin-001",
        organizationId: org.id,
        email: "admin@demo.com",
        role: "ADMIN" as const,
        name: "Admin User",
      },
      {
        id: "demo-owner-001",
        organizationId: org.id,
        email: "owner@demo.com",
        role: "OWNER" as const,
        name: "Owner User",
      },
      {
        id: "demo-agent-001",
        organizationId: org.id,
        email: "agent1@demo.com",
        role: "AGENT" as const,
        name: "Agent Ján Novák",
      },
      {
        id: "demo-agent-002",
        organizationId: org.id,
        email: "agent2@demo.com",
        role: "AGENT" as const,
        name: "Agent Peter Horváth",
      },
      {
        id: "demo-agent-003",
        organizationId: org.id,
        email: "agent3@demo.com",
        role: "AGENT" as const,
        name: "Agent Mária Kováčová",
      },
    ];

    let usersCreated = 0;
    for (const user of demoUsers) {
      const existing = await db.query.users.findFirst({
        where: eq(users.id, user.id),
      });
      if (!existing) {
        await db.insert(users).values(user);
        usersCreated++;
      }
    }
    console.log(`✅ Created ${usersCreated} new users (${demoUsers.length} total)`);

    // 3. Create 50 demo clients (expanded from 30)
    console.log("Creating 50 demo clients...");
    const demoClients = [];
    for (let i = 0; i < 50; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const ico = String(10000000 + i).padStart(8, "0");

      demoClients.push({
        organizationId: org.id,
        companyName: companyNames[i % companyNames.length],
        ico,
        dic: `SK${ico}90`,
        foundedAt: randomDate(new Date(2010, 0, 1), new Date(2022, 11, 31))
          .toISOString()
          .split("T")[0],
        employeesCount: Math.floor(Math.random() * 100) + 1,
        annualRevenue: randomAmount(50000, 5000000),
        contactPerson: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${companyNames[i % companyNames.length]
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace("s.r.o.", "")}-${i}.sk`,
        phone: `+42190${String(1000000 + i).substring(0, 7)}`,
        address: `Hlavná ${i + 1}, ${81000 + (i % 10)} Bratislava`,
        city: i % 4 === 0 ? "Bratislava" : i % 4 === 1 ? "Košice" : i % 4 === 2 ? "Žilina" : "Banská Bystrica",
        postalCode: String(80000 + (i % 1000)),
      });
    }

    const createdClients = await db.insert(clients).values(demoClients).returning();
    console.log(`✅ Created ${createdClients.length} clients`);

    // 4. Create 50 applications (žiadosti) - expanded from 25
    console.log("Creating 50 applications...");
    const statuses = ["NEW", "REVIEWING", "DOCUMENTS_REQUESTED", "PENDING_APPROVAL", "APPROVED", "REJECTED"];
    const demoApplications = [];

    for (let i = 0; i < 50; i++) {
      const client = createdClients[i % createdClients.length];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const assignedTo = i % 3 === 0 ? "demo-agent-001" : i % 3 === 1 ? "demo-agent-002" : "demo-agent-003";

      demoApplications.push({
        organizationId: org.id,
        clientId: client.id,
        amount: randomAmount(5000, 100000),
        purpose: i % 4 === 0 ? "Nákup zariadenia" : i % 4 === 1 ? "Prevádzkový kapitál" : i % 4 === 2 ? "Rozšírenie podnikania" : "Refinancovanie",
        durationMonths: [6, 12, 18, 24, 36, 48][Math.floor(Math.random() * 6)],
        status: status as "NEW" | "REVIEWING" | "DOCUMENTS_REQUESTED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED",
        assignedToUserId: status !== "NEW" ? assignedTo : null,
      });
    }

    const createdApplications = await db.insert(applications).values(demoApplications).returning();
    console.log(`✅ Created ${createdApplications.length} applications`);

    // 5. Create 40 loans (expanded from 20)
    console.log("Creating 40 loans...");
    const now = new Date();
    const demoLoans = [];

    for (let i = 0; i < 40; i++) {
      const client = createdClients[i % createdClients.length];
      const startDate = randomDate(new Date(2022, 0, 1), new Date(2024, 11, 31));
      const durationMonths = [6, 12, 18, 24, 36, 48][Math.floor(Math.random() * 6)];
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);

      const amount = randomAmount(5000, 100000);
      const interestRate = (6 + Math.random() * 14).toFixed(2);
      const monthlyRate = (parseFloat(interestRate) / 12).toFixed(2);

      const isActive = startDate < now && endDate > now;
      const isLate = isActive && Math.random() > 0.75;

      demoLoans.push({
        organizationId: org.id,
        clientId: client.id,
        amount,
        interestRateAnnual: interestRate,
        interestRateMonthly: monthlyRate,
        productType: i % 2 === 0 ? ("INTEREST_ONLY" as const) : ("AMORTIZING" as const),
        durationMonths,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        status: isLate ? ("LATE" as const) : isActive ? ("ACTIVE" as const) : ("CLOSED" as const),
        variableSymbol: `2025${String(i + 1).padStart(4, "0")}`,
        disbursedAt: startDate,
      });
    }

    const createdLoans = await db.insert(loans).values(demoLoans).returning();
    console.log(`✅ Created ${createdLoans.length} loans`);

    // 6. Create installments for all loans
    console.log("Creating installments...");
    let totalInstallments = 0;

    for (const loan of createdLoans) {
      const isAmortizing = loan.productType === "AMORTIZING";
      const monthlyInterest = Math.floor((loan.amount * parseFloat(loan.interestRateMonthly)) / 100);

      let remainingPrincipal = loan.amount;
      const monthlyPrincipal = isAmortizing ? Math.floor(loan.amount / loan.durationMonths) : 0;

      for (let i = 0; i < loan.durationMonths; i++) {
        const dueDate = new Date(loan.startDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);

        const isLastInstallment = i === loan.durationMonths - 1;
        const principal = isAmortizing
          ? isLastInstallment
            ? remainingPrincipal
            : monthlyPrincipal
          : isLastInstallment
          ? loan.amount
          : 0;

        remainingPrincipal -= principal;

        const totalAmount = principal + monthlyInterest;
        const isPastDue = dueDate < now;
        const isPaid = isPastDue && Math.random() > 0.2; // 80% paid
        const isOverdue = isPastDue && !isPaid;

        await db.insert(installments).values({
          loanId: loan.id,
          dueDate: dueDate.toISOString().split("T")[0],
          principalAmount: principal,
          interestAmount: monthlyInterest,
          totalAmount,
          paidAmount: isPaid ? totalAmount : Math.random() > 0.8 ? Math.floor(totalAmount * 0.5) : 0,
          status: isPaid ? "PAID" : isOverdue ? "OVERDUE" : "UNPAID",
          paidAt: isPaid ? randomDate(dueDate, now) : null,
        });

        totalInstallments++;
      }
    }

    console.log(`✅ Created ${totalInstallments} installments`);

    // 7. Create payments
    console.log("Creating payments...");
    const allInstallments = await db.query.installments.findMany({
      where: eq(installments.status, "PAID"),
      with: { loan: true },
    });

    const demoPayments = allInstallments.slice(0, 50).map((inst) => ({
      loanId: inst.loanId,
      installmentId: inst.id,
      amount: inst.paidAmount,
      paidAt: inst.paidAt || new Date(),
      variableSymbol: inst.loan.variableSymbol,
      paymentMethod: Math.random() > 0.5 ? ("BANK_TRANSFER" as const) : ("CASH" as const),
    }));

    const createdPayments = await db.insert(payments).values(demoPayments).returning();
    console.log(`✅ Created ${createdPayments.length} payments`);

    // 8. Create collaterals (expanded from 15 to 40)
    console.log("Creating collaterals...");
    const collateralTypes = ["VEHICLE", "REAL_ESTATE", "OTHER"];
    const demoCollaterals = [];

    for (let i = 0; i < 40; i++) {
      const loan = createdLoans[i % createdLoans.length];
      const type = collateralTypes[Math.floor(Math.random() * collateralTypes.length)];

      let description = "";
      if (type === "VEHICLE") {
        const brands = ["Škoda", "Volkswagen", "BMW", "Audi", "Mercedes"];
        const models = ["Octavia", "Golf", "Passat", "Fabia", "Superb", "Roomster"];
        const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
        description = `${brands[Math.floor(Math.random() * brands.length)]} ${models[Math.floor(Math.random() * models.length)]} ${years[Math.floor(Math.random() * years.length)]}`;
      } else if (type === "REAL_ESTATE") {
        const types = ["Byt 1+1", "Byt 2+1", "Byt 3+1", "Byt 4+1", "Rodinný dom"];
        description = `${types[Math.floor(Math.random() * types.length)]}, Bratislava, ${80000 + i}`;
      } else {
        const others = ["Záväzky", "Cenné papiere", "Depozit", "Výrobné zariadenie"];
        description = others[Math.floor(Math.random() * others.length)];
      }

      demoCollaterals.push({
        loanId: loan.id,
        type: type as "VEHICLE" | "REAL_ESTATE" | "OTHER",
        description,
        estimatedValue: randomAmount(10000, 200000),
      });
    }

    const createdCollaterals = await db.insert(collaterals).values(demoCollaterals).returning();
    console.log(`✅ Created ${createdCollaterals.length} collaterals`);

    // 9. Create reminder policies
    console.log("Creating reminder policies...");
    const demoPolicies = [
      {
        organizationId: org.id,
        daysAfterDue: 7,
        reminderType: "EMAIL" as const,
        feeType: "FIXED" as const,
        feeAmount: "10.00",
        messageTemplate: `Dobrý deň {{client_name}},

upozorňujeme Vás, že splátka úveru vo výške {{installment_amount}}€ so splatnosťou {{due_date}} (VS: {{variable_symbol}}) nebola uhradená.

Poplatok za upomienku: {{fee_amount}}€

Prosíme o uhradenie v čo najkratšom čase.

S pozdravom,
Demo Finance s.r.o.`,
      },
      {
        organizationId: org.id,
        daysAfterDue: 14,
        reminderType: "SMS" as const,
        feeType: "FIXED" as const,
        feeAmount: "15.00",
        messageTemplate:
          "Upomienka: Splatka {{installment_amount}}€ (VS: {{variable_symbol}}) po splatnosti. Poplatok: {{fee_amount}}€. Prosim uhradte.",
      },
      {
        organizationId: org.id,
        daysAfterDue: 30,
        reminderType: "EMAIL" as const,
        feeType: "PERCENTAGE" as const,
        feeAmount: "5.00",
        messageTemplate: `Dobrý deň {{client_name}},

POSLEDNÁ UPOMIENKA pred právnymi krokmi.

Splátka {{installment_amount}}€ (VS: {{variable_symbol}}) je po splatnosti viac ako 30 dní.
Poplatok: {{fee_amount}}€ (5% z dlžnej sumy)

Kontaktujte nás okamžite: +421 900 123 456

Demo Finance s.r.o.`,
      },
    ];

    const createdPolicies = await db.insert(reminderPolicies).values(demoPolicies).returning();
    console.log(`✅ Created ${createdPolicies.length} reminder policies`);

    // 10. Create some reminders
    console.log("Creating reminders...");
    const overdueInstallments = await db.query.installments.findMany({
      where: eq(installments.status, "OVERDUE"),
      with: { loan: true },
      limit: 10,
    });

    const demoReminders = overdueInstallments.map((inst) => ({
      organizationId: org.id,
      installmentId: inst.id,
      policyId: createdPolicies[0].id,
      sentAt: randomDate(new Date(inst.dueDate), now),
      feeCharged: 1000, // €10.00
      status: Math.random() > 0.5 ? ("SENT" as const) : ("FAILED" as const),
    }));

    if (demoReminders.length > 0) {
      const createdReminders = await db.insert(reminders).values(demoReminders).returning();
      console.log(`✅ Created ${createdReminders.length} reminders`);
    }

    // 11. Create contract templates
    console.log("Creating contract templates...");
    const demoTemplates = [
      {
        organizationId: org.id,
        name: "Zmluva o pôžičke - štandard",
        type: "LOAN_AGREEMENT" as const,
        templateContent: `<h1>ZMLUVA O PÔŽIČKE</h1>
<p>uzavretá podľa § 657 a nasl. Občianskeho zákonníka</p>

<h2>Zmluvné strany:</h2>
<p><strong>Veriteľ:</strong> {{organization_name}}<br>
IČO: {{organization_ico}}</p>

<p><strong>Dlžník:</strong> {{client_name}}<br>
IČO: {{client_ico}}</p>

<h2>Predmet zmluvy:</h2>
<p>Veriteľ poskytuje dlžníkovi pôžičku vo výške <strong>{{loan_amount}} EUR</strong> s úrokovou sadzbou <strong>{{interest_rate}}% p.a.</strong></p>

<p>Doba splatnosti: {{duration_months}} mesiacov</p>
<p>Variabilný symbol: {{variable_symbol}}</p>`,
        isActive: true,
      },
      {
        organizationId: org.id,
        name: "Zmluva o záložnom práve",
        type: "COLLATERAL_AGREEMENT" as const,
        templateContent: `<h1>ZMLUVA O ZÁLOŽNOM PRÁVE</h1>

<p><strong>Záložca:</strong> {{client_name}}</p>
<p><strong>Záložný veriteľ:</strong> {{organization_name}}</p>

<h2>Predmet záložného práva:</h2>
<p>{{collateral_description}}</p>
<p>Odhadovaná hodnota: {{collateral_value}} EUR</p>`,
        isActive: true,
      },
    ];

    const createdTemplates = await db.insert(contractTemplates).values(demoTemplates).returning();
    console.log(`✅ Created ${createdTemplates.length} contract templates`);

    // 12. Create documents (expanded from 30 to 60)
    console.log("Creating documents...");
    const documentCategories = ["APPRAISAL", "BANK_STATEMENT", "ID_CARD", "CONTRACT", "OTHER"];
    const demoDocuments = [];

    for (let i = 0; i < 60; i++) {
      const loan = createdLoans[i % createdLoans.length];
      const category = documentCategories[Math.floor(Math.random() * documentCategories.length)];
      const daysSinceUpload = Math.floor(Math.random() * 365);

      demoDocuments.push({
        organizationId: org.id,
        entityType: "LOAN" as const,
        entityId: loan.id,
        category: category as "APPRAISAL" | "BANK_STATEMENT" | "ID_CARD" | "CONTRACT" | "OTHER",
        fileName: `${category.toLowerCase()}_${loan.variableSymbol}_${i}.pdf`,
        fileUrl: `https://storage.supabase.co/documents/${org.id}/${loan.id}/${category.toLowerCase()}_${i}.pdf`,
        uploadedBy: "demo-admin-001",
        uploadedAt: new Date(new Date().getTime() - daysSinceUpload * 24 * 60 * 60 * 1000),
      });
    }

    const createdDocuments = await db.insert(documents).values(demoDocuments).returning();
    console.log(`✅ Created ${createdDocuments.length} documents`);

    // Summary
    console.log("\n🎉 Comprehensive seed completed successfully!");
    console.log("\n📊 Created:");
    console.log(`  - 1 organization`);
    console.log(`  - ${demoUsers.length} users`);
    console.log(`  - ${createdClients.length} clients`);
    console.log(`  - ${createdApplications.length} applications`);
    console.log(`  - ${createdLoans.length} loans`);
    console.log(`  - ${totalInstallments} installments`);
    console.log(`  - ${createdPayments.length} payments`);
    console.log(`  - ${createdCollaterals.length} collaterals`);
    console.log(`  - ${createdPolicies.length} reminder policies`);
    console.log(`  - ${demoReminders.length} reminders`);
    console.log(`  - ${createdTemplates.length} contract templates`);
    console.log(`  - ${createdDocuments.length} documents`);
    console.log(
      `\n  TOTAL: ${
        1 +
        demoUsers.length +
        createdClients.length +
        createdApplications.length +
        createdLoans.length +
        totalInstallments +
        createdPayments.length +
        createdCollaterals.length +
        createdPolicies.length +
        demoReminders.length +
        createdTemplates.length +
        createdDocuments.length
      } records`
    );

    console.log("\n🔑 Demo credentials:");
    console.log("  Admin: admin@demo.com");
    console.log("  Owner: owner@demo.com");
    console.log("  Agent 1: agent1@demo.com");
    console.log("  Agent 2: agent2@demo.com");
    console.log("  Agent 3: agent3@demo.com");
    console.log("\n📈 Enhanced test data includes:");
    console.log("  - 50 clients with varied company profiles");
    console.log("  - 50 applications with all statuses");
    console.log("  - 40 loans (active, closed, late)");
    console.log("  - Multiple collateral types (vehicles, real estate, machinery)");
    console.log("  - Diverse documents for compliance testing");
    console.log("  - Reminder policies for automation testing");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run seed
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
