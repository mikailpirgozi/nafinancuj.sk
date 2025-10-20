import { db } from "@/db";
import { clients } from "@/db/schema/clients";
import { loans } from "@/db/schema/loans";
import { applications } from "@/db/schema/applications";
import { installments } from "@/db/schema/installments";
import { payments } from "@/db/schema/payments";
import { reminders } from "@/db/schema/reminders";
import { reminderPolicies } from "@/db/schema/reminder-policies";
import { documents } from "@/db/schema/documents";
import { collaterals } from "@/db/schema/collaterals";

const DEMO_ORGANIZATION_ID = "demo-org-001";
const DEMO_USER_ID = "demo-user-001";

const generateICO = () => {
  const num = Math.floor(Math.random() * 100000000);
  return String(num).padStart(8, "0");
};

const generateVariableSymbol = () => {
  return String(Math.floor(Math.random() * 1000000000)).padStart(10, "0");
};

export async function seedComplexData() {
  try {
    console.log("🌱 Seeding complex demo data...\n");

    // 1. Create 20+ clients
    console.log("📋 Creating 20+ clients...");
    const clientIds: string[] = [];

    const clientNames = [
      "ACME Corporation s.r.o.",
      "TechStart Slovakia",
      "Global Trade Ltd.",
      "Slovak Industries",
      "Innovation Hub s.r.o.",
      "Digital Solutions",
      "Manufacturing Group",
      "Finance Partners",
      "Export Company",
      "Consulting Pro",
      "Retail Network",
      "Construction Works",
      "Transport Services",
      "Hotel & Tourism",
      "Food & Beverages",
      "Energy Solutions",
      "Telecom Services",
      "Real Estate Invest",
      "Media Company",
      "Education Services",
      "Healthcare Group",
      "Logistics Plus",
      "Agriculture Corp",
      "Chemistry Industry",
      "Automotive Parts",
    ];

    for (let i = 0; i < clientNames.length; i++) {
      const clientData = {
        name: clientNames[i],
        ico: generateICO(),
        dic: `SK${generateICO()}`,
        email: `contact${i}@${clientNames[i].toLowerCase().replace(/\s+/g, "")}.sk`,
        phone: `+421${Math.floor(Math.random() * 900000000 + 100000000)}`,
        address: `Adresa ${i + 1}, Bratislava`,
        city: "Bratislava",
        postalCode: `${80000 + i}`,
        organizationId: DEMO_ORGANIZATION_ID,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      };

      const result = await db
        .insert(clients)
        .values(clientData)
        .returning({ id: clients.id });

      if (result[0]) {
        clientIds.push(result[0].id);
        console.log(`  ✅ Created client: ${clientNames[i]}`);
      }
    }

    // 2. Create 50+ loans with various statuses
    console.log("\n💰 Creating 50+ loans...");
    const loanIds: string[] = [];
    const statuses = ["ACTIVE", "COMPLETED", "DEFAULTED", "PENDING_APPROVAL"];

    for (let i = 0; i < 50; i++) {
      const clientId = clientIds[i % clientIds.length];
      const amount = Math.floor(Math.random() * 1000000) + 10000; // 10k - 1M
      const duration = [6, 12, 24, 36, 48, 60][Math.floor(Math.random() * 6)];
      const interestRate = (Math.random() * 10 + 2).toFixed(1); // 2% - 12%

      const loanData = {
        clientId,
        organizationId: DEMO_ORGANIZATION_ID,
        amount,
        interestRateAnnual: parseFloat(interestRate),
        durationMonths: duration,
        variableSymbol: generateVariableSymbol(),
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        productType: ["BUSINESS_LOAN", "PERSONAL_LOAN", "EMERGENCY_LOAN"][
          Math.floor(Math.random() * 3)
        ] as any,
        riskClassification: ["LOW", "MEDIUM", "HIGH"][Math.floor(Math.random() * 3)] as any,
        startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db
        .insert(loans)
        .values(loanData)
        .returning({ id: loans.id });

      if (result[0]) {
        loanIds.push(result[0].id);
      }
    }

    console.log(`  ✅ Created 50 loans`);

    // 3. Create installments for each loan
    console.log("\n📊 Creating installments...");
    let totalInstallments = 0;

    for (const loanId of loanIds) {
      const loan = await db
        .select()
        .from(loans)
        .where(db.eq(loans.id, loanId))
        .limit(1)
        .then((rows) => rows[0]);

      if (!loan) continue;

      const installmentAmount = Math.floor(loan.amount / loan.durationMonths);

      for (let i = 1; i <= loan.durationMonths; i++) {
        const dueDate = new Date(loan.startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        const isPaid = Math.random() > 0.3; // 70% chance paid
        const isOverdue = !isPaid && dueDate < new Date();

        await db.insert(installments).values({
          loanId,
          installmentNumber: i,
          dueDate,
          principalAmount: installmentAmount,
          interestAmount: Math.floor((installmentAmount * loan.interestRateAnnual) / 1200),
          totalAmount: installmentAmount + Math.floor((installmentAmount * loan.interestRateAnnual) / 1200),
          paidAmount: isPaid ? installmentAmount + Math.floor((installmentAmount * loan.interestRateAnnual) / 1200) : 0,
          status: isOverdue ? "OVERDUE" : isPaid ? "PAID" : "UNPAID",
          paidAt: isPaid ? new Date(dueDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        totalInstallments++;
      }
    }

    console.log(`  ✅ Created ${totalInstallments} installments`);

    // 4. Create 30+ applications with various statuses
    console.log("\n📝 Creating 30+ applications...");
    const appStatuses = ["DRAFT", "PENDING_REVIEW", "DOCUMENTS_REQUESTED", "APPROVED", "REJECTED"];

    for (let i = 0; i < 30; i++) {
      const clientId = clientIds[i % clientIds.length];

      await db.insert(applications).values({
        clientId,
        organizationId: DEMO_ORGANIZATION_ID,
        loanAmount: Math.floor(Math.random() * 500000) + 5000,
        loanDuration: [6, 12, 24, 36][Math.floor(Math.random() * 4)],
        status: appStatuses[Math.floor(Math.random() * appStatuses.length)] as any,
        description: "Sample loan application for testing",
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      });
    }

    console.log(`  ✅ Created 30 applications`);

    // 5. Create 100+ payments
    console.log("\n💳 Creating 100+ payments...");
    let totalPayments = 0;

    for (const loanId of loanIds.slice(0, 30)) {
      const numPayments = Math.floor(Math.random() * 4) + 1;

      for (let i = 0; i < numPayments; i++) {
        const amount = Math.floor(Math.random() * 50000) + 1000;

        await db.insert(payments).values({
          loanId,
          variableSymbol: generateVariableSymbol(),
          amount,
          paymentMethod: ["BANK_TRANSFER", "CASH", "CARD"][Math.floor(Math.random() * 3)] as any,
          status: Math.random() > 0.2 ? "COMPLETED" : "PENDING",
          paidAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        totalPayments++;
      }
    }

    console.log(`  ✅ Created ${totalPayments} payments`);

    // 6. Create reminder policies
    console.log("\n🔔 Creating reminder policies...");

    const policyData = [
      {
        name: "7 days before due",
        daysAfterDue: -7,
        reminderType: "EMAIL",
        feeType: "NONE",
        feeAmount: 0,
        messageTemplate: "Upozornenie: Vaša splátka splatnosťou {{due_date}} sa blíži.",
      },
      {
        name: "Day of due date",
        daysAfterDue: 0,
        reminderType: "EMAIL",
        feeType: "NONE",
        feeAmount: 0,
        messageTemplate: "Pripomenutie: Dnes bol termín splatnosti Vašej splátky {{due_date}}.",
      },
      {
        name: "3 days overdue",
        daysAfterDue: 3,
        reminderType: "SMS",
        feeType: "FIXED",
        feeAmount: 500,
        messageTemplate: "Vaša splátka je po lehote. Prosím, zaplaťte bez meškania.",
      },
      {
        name: "10 days overdue",
        daysAfterDue: 10,
        reminderType: "EMAIL_AND_SMS",
        feeType: "FIXED",
        feeAmount: 1000,
        messageTemplate: "Upozornenie: Vážna omeškania Vašej splátky. Kontaktujte nás prosím.",
      },
    ];

    const policyIds: string[] = [];

    for (const policy of policyData) {
      const result = await db
        .insert(reminderPolicies)
        .values({
          ...policy,
          organizationId: DEMO_ORGANIZATION_ID,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: reminderPolicies.id });

      if (result[0]) {
        policyIds.push(result[0].id);
      }
    }

    console.log(`  ✅ Created ${policyIds.length} reminder policies`);

    // 7. Create 20+ collaterals
    console.log("\n🏠 Creating 20+ collaterals...");

    const collateralTypes = ["REAL_ESTATE", "VEHICLE", "EQUIPMENT", "OTHER"];

    for (let i = 0; i < 20; i++) {
      const loanId = loanIds[i % loanIds.length];

      await db.insert(collaterals).values({
        loanId,
        type: collateralTypes[i % collateralTypes.length] as any,
        description: `Collateral ${i + 1} for loan`,
        estimatedValue: Math.floor(Math.random() * 500000) + 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log(`  ✅ Created 20 collaterals`);

    // 8. Create documents
    console.log("\n📄 Creating 30+ documents...");

    for (let i = 0; i < 30; i++) {
      const loanId = loanIds[i % loanIds.length];

      await db.insert(documents).values({
        loanId,
        organizationId: DEMO_ORGANIZATION_ID,
        fileName: `document_${i + 1}.pdf`,
        fileSize: Math.floor(Math.random() * 5000) + 100,
        fileType: ["pdf", "jpg", "docx"][Math.floor(Math.random() * 3)],
        fileUrl: `https://example.com/documents/doc_${i}.pdf`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    console.log(`  ✅ Created 30 documents`);

    console.log("\n✅ Complex data seeding completed successfully!");
    console.log(`\n📊 Summary:`);
    console.log(`  - Clients: ${clientNames.length}`);
    console.log(`  - Loans: ${loanIds.length}`);
    console.log(`  - Installments: ${totalInstallments}`);
    console.log(`  - Payments: ${totalPayments}`);
    console.log(`  - Reminder Policies: ${policyIds.length}`);
    console.log(`  - Collaterals: 20`);
    console.log(`  - Documents: 30`);
  } catch (error) {
    console.error("❌ Error seeding complex data:", error);
    throw error;
  }
}

if (require.main === module) {
  seedComplexData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
