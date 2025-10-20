# Nafinancuj.sk - Loan Management System

Komplexný systém na správu spotrebiteľských úverov s pokročilými možnosťami správy klientov, monitorovania splátok, reportingu a automatizácie.

## 🎯 Funkcionalita

### Core Features
- **Správa klientov** - CRM pre klientov s historickými dátami a štatistikami
- **Správa úverov** - Celý lifecycle úverov: vytvorenie, splátky, omeškania, predčasné splatenie
- **Žiadosti o úvery** - Workflow spracovanie žiadostí so schvaľovaním a konverziou na úvery
- **Splátky a platby** - Tracking platieb, CSV import/export, párovanie nepárovaných platieb
- **Spomienky** - Automatické upomienky na overdue splátky s konfigurovateľnými politikami
- **Dokumenty** - Upload a správa dokumentov (PDF, JPG, PNG, DOCX)
- **Zmluvy** - Generovanie PDF zmlúv z šablón
- **Reporty** - Komplexný reporting: cash flow, portfolio analýza, top klienti
- **Audit logging** - Úplná história všetkých zmien v systéme

### Advanced Features
- **Finstat integrácia** - Automatické načítavanie dát klientov z Finstat API
- **Rate limiting** - Ochrana API pred zneužitím
- **Caching** - Optimalizácia performancie
- **Bezpečnosť** - Input sanitization, error handling, environment validation

## 📋 Požiadavky

- **Node.js** 18+
- **pnpm** (package manager)
- **Supabase** account (PostgreSQL + Storage)
- **Clerk** account (Authentication)

## 🚀 Rýchly štart

### 1. Klonujte a nainštalujte

```bash
git clone <repo-url>
cd nafinancuj.sk
pnpm install
```

### 2. Environment setup

```bash
cp .env.example .env.local
```

Vyplňte v `.env.local`:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key

# Database
DATABASE_URL=your_connection_string

# Optional APIs
FINSTAT_API_KEY=your_key
RESEND_API_KEY=your_key
CRON_SECRET=your_secret
```

### 3. Database migrations

```bash
pnpm db:push
pnpm db:seed
```

### 4. Spustite dev server

```bash
pnpm dev
```

Aplikácia bude dostupná na http://localhost:3000

## 📚 API Dokumentácia

### Authentication
Všetky API endpointy vyžadujú autentifikáciu cez Clerk JWT token.

### Hlavné endpointy

#### Klienti
- `GET /api/clients` - Zoznam klientov
- `POST /api/clients` - Vytvorenie klienta
- `GET /api/clients/[id]` - Detail klienta
- `GET /api/clients/[id]/stats` - Štatistiky klienta
- `GET /api/clients/[id]/notes` - Poznámky klienta

#### Úvery
- `GET /api/loans` - Zoznam úverov
- `POST /api/loans` - Vytvorenie úveru
- `GET /api/loans/[id]` - Detail úveru
- `POST /api/loans/[id]/early-repayment` - Predčasné splatenie

#### Platby
- `GET /api/payments` - Zoznam platieb
- `POST /api/payments` - Vytvorenie platby
- `POST /api/payments/[id]/match` - Párovanie platby

#### Reporty
- `GET /api/reports/overview` - Prehľad
- `GET /api/reports/cash-flow` - Cash flow analýza
- `GET /api/reports/portfolio` - Portfolio rozdelenie
- `GET /api/reports/top-clients` - TOP klienti

#### Audit
- `GET /api/audit-logs` - Audit logy s filtrovaním

### Error Handling

API vráti HTTP status codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request (validačná chyba)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Server Error

## 🏗️ Štruktúra projektu

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── dashboard/         # Dashboard stránky
│   └── sign-in/           # Authentication pages
├── components/            # React komponenty
│   └── ui/               # shadcn/ui komponenty
├── db/                    # Databáza (Drizzle ORM)
│   ├── schema/           # Database schemas
│   └── migrations/       # SQL migrations
├── lib/                   # Utility funkcie
│   ├── services/         # Business logic
│   ├── validators/       # Zod schemas
│   └── cache.ts          # Caching utility
└── scripts/              # Skrypty (seed, etc.)

tests/
├── e2e/                  # End-to-End testy (Playwright)
└── fixtures/             # Test data
```

## 🧪 Testovanie

### Unit testy
```bash
pnpm test
```

### E2E testy
```bash
pnpm test:e2e
```

### Lint & Type Check
```bash
pnpm lint
pnpm typecheck
```

## 📦 Build a Deployment

### Production build
```bash
pnpm build
pnpm start
```

### Deployment na Vercel
```bash
git push origin main
```

Vercel automaticky deployuje z main branch. Supabase databáza je hostovaná samostatne.

### Environment na produkcii
Nastavte environment variables v Vercel dashboard pod **Settings → Environment Variables**.

## 🔒 Bezpečnosť

- ✅ Input sanitization (XSS protection)
- ✅ Rate limiting na kritických endpointoch
- ✅ Environment validation
- ✅ Error boundaries
- ✅ Audit logging
- ✅ Database indexy pre performance

## 📊 Performance

- Database indexy na hot queries
- API response caching (5 min default)
- Frontend optimizations (React.memo, useMemo, lazy loading)
- Image optimization s next/image
- Bundle size monitoring

## 🤝 Contributing

1. Vytvorte feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit zmeny (`git commit -m 'Add AmazingFeature'`)
3. Push do branch (`git push origin feature/AmazingFeature`)
4. Otvorte Pull Request

## 📄 Licencia

Proprietary - Copyright 2024. Všetky práva vyhradené.

## 📞 Kontakt

- Email: support@nafinancuj.sk
- Website: https://nafinancuj.sk

---

**Status:** Production Ready (85% completed, 100% functional core)  
**Last Updated:** 2024  
**Version:** 1.0.0
