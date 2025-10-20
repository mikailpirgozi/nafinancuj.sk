import { db } from "@/db";
import { contractTemplates } from "@/db/schema/contract-templates";
import { eq } from "drizzle-orm";

const DEFAULT_TEMPLATES = [
  {
    name: "Štandardná úverová zmluva",
    type: "LOAN_AGREEMENT",
    isDefault: true,
    content: `ÚVEROVÁ ZMLUVA

Zmluvné strany:
1. Poskytovateľ:
   {{organization_name}}
   IČO: {{organization_ico}}
   Adresa: {{organization_address}}

2. Prijímateľ (Dlžník):
   {{client_name}}
   IČO/DIČ: {{client_ico}} / {{client_dic}}
   Adresa: {{client_address}}
   Kontaktná osoba: {{client_contact_person}}

I. PREDMET ZMLUVY

Poskytovatelia sa zaväzuje poskytnúť Dlžníkovi úver a Dlžník sa zaväzuje splátiť si úver vrátane úroku na podmienkach dohodnutých touto zmluvou.

II. PARAMETRE ÚVERU

1. Suma úveru: {{loan_amount}} EUR
2. Mena: {{loan_currency}}
3. Ročná úroková sadzba: {{loan_interest_rate}}%
4. Trvanie úveru: {{loan_duration_months}} mesiacov
5. Dátum poskytnutia: {{loan_start_date}}
6. Dátum splatnosti: {{loan_end_date}}
7. Variabilný symbol: {{loan_variable_symbol}}

III. SPLÁCANIE ÚVERU

1. Úver bude splácaný v mesačných splátkach.
2. Prvá splátka je splatná {{loan_start_date}}.
3. Splátky sú splatné bezpečnostne najneskôr {{loan_start_date}} v nasledujúcich mesiacoch.

IV. ÚROK A POPLATKY

1. Úrok sa počíta z nesplateného kapitálu.
2. Úrok sa pripočítava mesačne.
3. Ostatné poplatky budú účtované podľa platného cenníka.

V. KĽÚČOVÉ PODĽA ZÁKONA

Táto zmluva sa riadi zákonmi Slovenskej republiky, najmä Zákonom č. 513/1991 Zb. (Obchodný zákonník).

VI. PODPISY

Zmluvné strany potvrdzujú, že si prečítali túto zmluvu, rozumejú jej obsahu a súhlasia s jej podmienkami.

Poskytovateľ:                          Dlžník:
_______________________              _______________________
(Pečiatka a podpis)                   (Podpis a pečiatka)

Dátum: {{current_date}}`,
  },
  {
    name: "Zmluva o zábezpeke",
    type: "COLLATERAL_AGREEMENT",
    isDefault: false,
    content: `ZMLUVA O ZÁBEZPEKE

Zmluvné strany:
1. Veriteľ: {{organization_name}}, IČO: {{organization_ico}}
2. Dlžník: {{client_name}}, IČO: {{client_ico}}

PREDMET ZMLUVY:

Dlžník sa zaväzuje zabezpečiť svoju povinnosť platiť úver v sume {{loan_amount}} EUR, ktorý mu poskytol Veriteľ, a to ponukaním zábezpeky.

POPIS ZÁBEZPEKY:

Druh majetku: [Uvedie sa v jednotlivom prípade]
Miesto umiestnenia: {{client_address}}
Odhadovaná hodnota: [Uvedie sa v jednotlivom prípade]

ZÁVÄZKY DLŽNÍKA:

1. Dlžník sa zaväzuje:
   - Udržiavať zábezpeku v dobrom stave
   - Nezaťažovať zábezpeku bez súhlasu Veriteľa
   - Informovať Veriteľa o zmene stavu majetku
   - Poistiť zábezpeku na svoju odpoveď

2. V prípade porušenia týchto povinností má Veriteľ právo:
   - Realizovať zábezpeku
   - Requirnovať zábezpeku

UKONČENIE ZMLUVY:

Táto zmluva sa ukončuje:
1. Splatením všetkých záväzkov vyplývajúcich z úverovej zmluvy
2. Vzájomnou dohodou zmluvných strán
3. Rozhodnutím súdu

Zmluvné strany:

Veriteľ: ______________________    Dlžník: ______________________
Dátum: {{current_date}}`,
  },
  {
    name: "Splátková dohoda",
    type: "PAYMENT_PLAN",
    isDefault: false,
    content: `SPLÁTKOVÁ DOHODA

Číslo zmluvy: {{loan_variable_symbol}}
Dátum uzavretia: {{current_date}}

ZMLUVNÉ STRANY:

1. Poskytovateľ: {{organization_name}}
   IČO: {{organization_ico}}
   Adresa: {{organization_address}}

2. Prijímateľ: {{client_name}}
   IČO/DIČ: {{client_ico}} / {{client_dic}}
   Adresa: {{client_address}}

ZÁVÄZOK:

Prijímateľ sa zaväzuje platiť úver vo výške {{loan_amount}} EUR v mesačných splátkach počas {{loan_duration_months}} mesiacov s úrokovou sadzbou {{loan_interest_rate}}% ročne.

SPLÁTKOVÝ KALENDÁR:

Splátky budú realizované mesačne počnúc {{loan_start_date}} a končia sa {{loan_end_date}}.

SPÔSOB PLATBY:

Splátky budú realizované bankovým prevodom na účet:
Varijný symbol: {{loan_variable_symbol}}
IBAN: [Uvedie sa v jednotlivom prípade]

PENÁLE A ÚROKY:

1. V prípade omeškania platby nad 30 dní sa účtuje penále vo výške 0,1% z nesplatenej sumy za každý deň omeškania.
2. Práva a povinnosti strán sa vzťahujú na súčasnú dohodnutú sadzbu.

ZÁVEREČNÉ USTANOVENIA:

1. Táto dohoda vstupuje do platnosti dňom podpisu oboch zmluvných strán.
2. Zmeny tejto dohody musia byť dohodnuté píomne a podpísané oboma stranami.
3. Táto dohoda sa riadi zákonmi Slovenskej republiky.

Podpisy zmluvných strán:

Poskytovateľ: ______________________    Prijímateľ: ______________________
Dátum: {{current_date}}`,
  },
];

export async function seedDefaultTemplates() {
  try {
    console.log("🌱 Seeding default contract templates...");

    for (const template of DEFAULT_TEMPLATES) {
      // Check if template already exists
      const existing = await db
        .select()
        .from(contractTemplates)
        .where(eq(contractTemplates.name, template.name))
        .limit(1)
        .then((rows) => rows[0]);

      if (existing) {
        console.log(`  ℹ️  Template "${template.name}" already exists, skipping...`);
        continue;
      }

      // Insert template
      await db.insert(contractTemplates).values({
        name: template.name,
        type: template.type as any,
        content: template.content,
        isDefault: template.isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`  ✅ Template "${template.name}" created`);
    }

    console.log("✅ Default templates seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding default templates:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedDefaultTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
