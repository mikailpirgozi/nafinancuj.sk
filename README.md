# Nafinancuj.sk Platform

Automatizovaná multi-tenant platforma pre správu podnikateľských pôžičiek s kompletným CRM systémom, splátkových kalendárom, upomienkami a dokumentmi.

## 🎯 Popis

Nafinancuj.sk je interný CRM systém pre správu zabezpečených krátkodobých pôžičiek pre slovenských podnikateľov. Systém automatizuje celý proces od prijatia žiadosti cez schválenie až po správu splátok a upomienok.

## 🚀 Tech Stack

### Frontend & Backend
- **Next.js 15** (App Router) + TypeScript
- **Next.js API Routes**

### Database & ORM
- **Supabase PostgreSQL**
- **Drizzle ORM**

### Auth & Storage
- **Clerk** (autentifikácia a user management)
- **Supabase Storage** (dokumenty, PDF)

### UI & Forms
- **Tailwind CSS** + **shadcn/ui**
- **React Hook Form** + **Zod** validácia
- Design podľa nafinancuj.sk (tmavomodrá/oranžová schéma)

### Data & PDF
- **TanStack Query** (React Query)
- **@react-pdf/renderer**

### Notifications
- **Resend** (email)
- **Twilio** (SMS)

### Hosting & Monitoring
- **Vercel**
- **Sentry**

### Multi-tenant
- Single database s `organization_id` column
- Row-level security

## 📋 Hlavné Funkcie

### 1. Multi-tenant Architektúra
- Super Admin môže spravovať viacero organizácií
- Každá organizácia má vlastných používateľov, klientov a úvery
- Kompletná izolácia dát medzi organizáciami

### 2. CRM Modul
- Prijímanie žiadostí z webového formulára
- Workflow: Nová → Kontrola → Podklady → Schválenie
- Priraďovanie žiadostí agentom
- Upload a správa dokumentov

### 3. Správa Úverov
- Dva typy produktov: Amortizačný a Interest-only
- Automatické generovanie splátkového kalendára
- Variabilné symboly pre párovanie platieb
- Zabezpečenia (nehnuteľnosti, autá)

### 4. Platby a Splátky
- Manuálne pridávanie platieb
- CSV import z banky (Tatra banka)
- Automatické párovanie podľa VS
- Čiastočné platby
- Predčasné splatenie (50% zľava na úroky)

### 5. Upomienky
- Konfigurovateľná politika pre každú organizáciu
- Automatické generovanie (Vercel Cron)
- Email a SMS notifikácie
- Automatické pripočítanie poplatkov

### 6. PDF Generátor
- Flexibilný systém šablón zmlúv
- Admin môže vytvárať vlastné šablóny
- Automatické generovanie PDF
- Premenné v šablónach

### 7. Dashboardy a Reporty
- Super Admin: Prehľad všetkých organizácií
- Admin/Owner: Štatistiky úverov a žiadostí
- Agent: Moje žiadosti a úvery
- Export do Excel/CSV

## 🛠️ Setup

### Požiadavky
- Node.js 20+
- pnpm 10+
- PostgreSQL (Supabase)

### Inštalácia

```bash
# Klonovanie repository
git clone <repository-url>
cd nafinancuj-sk

# Inštalácia závislostí
pnpm install

# Skopírovanie .env.example do .env.local
cp .env.example .env.local

# Vyplnenie environment premenných v .env.local
# DATABASE_URL, CLERK keys, SUPABASE keys, atď.

# Spustenie Drizzle migrácií
pnpm db:migrate

# Seed dát (demo organizácia)
pnpm db:seed

# Spustenie dev servera
pnpm dev
```

Server beží na `http://localhost:3000`

## 📝 Skripty

```bash
pnpm dev          # Spustenie dev servera (port 3000)
pnpm build        # Build pre produkciu
pnpm start        # Spustenie produkčného servera
pnpm lint         # ESLint kontrola
pnpm lint:fix     # ESLint oprava
pnpm typecheck    # TypeScript kontrola
pnpm format       # Prettier formátovanie
pnpm format:check # Prettier kontrola
```

## 🗄️ Dátový Model

### Core Entities
- **organizations** – Organizácie (firmy používajúce systém)
- **users** – Používatelia (Super Admin, Owner, Admin, Agent, Viewer)
- **clients** – Firemní klienti (dlžníci)
- **applications** – Žiadosti o pôžičku
- **loans** – Schválené úvery
- **installments** – Splátkový kalendár
- **payments** – Evidencia platieb
- **collaterals** – Zabezpečenia
- **documents** – Nahrané dokumenty
- **reminder_policies** – Politika upomienok
- **reminders** – Odoslané upomienky
- **contract_templates** – Šablóny zmlúv
- **audit_logs** – Audit trail

## 🔐 Role a Permissions

- **SUPER_ADMIN** – Správa všetkých organizácií
- **OWNER** – Vlastník organizácie, plný prístup
- **ADMIN** – Administrátor, plný prístup k dátam
- **AGENT** – Spracúva žiadosti a úvery
- **VIEWER** – Len čítanie

## 🚀 Deployment

Aplikácia je optimalizovaná pre Vercel:

```bash
# Push do GitHub
git push origin main

# Vercel automaticky deployuje
```

## 📚 Dokumentácia

Detailná implementačná dokumentácia je v súbore `nafinancuj-sk-platform.plan.md`.

## 🔒 Bezpečnosť

- ✅ HTTPS (Vercel automaticky)
- ✅ Rate limiting
- ✅ Input validation (Zod)
- ✅ Row-level security (organization_id)
- ✅ Audit logs
- ✅ GDPR compliance
- ✅ Secure file uploads (signed URLs)

## 📄 Licencia

Proprietary - Všetky práva vyhradené.

## 👥 Tím

Vyvinuté pre nafinancuj.sk

---

**Verzia:** 0.1.0  
**Posledná aktualizácia:** Október 2025
