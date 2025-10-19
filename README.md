# 🏦 Nafinancuj.sk - Platforma pre správu podnikateľských pôžičiek

Automatizovaná platforma pre správu podnikateľských pôžičiek s pokročilými funkciami pre finančné inštitúcie.

## ✨ Hlavné funkcie

### 🔔 Automatické upomienky
- Konfigurovateľné politiky upomienok
- Email a SMS notifikácie (Resend + Twilio)
- Automatické pripočítanie poplatkov
- Vercel Cron job (denne o 6:00)
- Šablóny správ s premennými

### 📊 Dashboardy
- **Super Admin Dashboard** - Prehľad všetkých organizácií
- **Main Dashboard** - Štatistiky úverov, grafy, reporty
- Export do Excel/CSV
- Real-time metriky

### 💼 Správa úverov
- Amortizačné a úrokové úvery
- Automatický výpočet splátok
- Splátkové kalendáre
- Sledovanie platieb
- Kolaterály

### 👥 Multi-tenancy
- Organizácie s vlastnými nastaveniami
- RBAC (Super Admin, Admin, Owner, Agent)
- Row-level security

### 📄 Dokumenty
- Supabase Storage integrácia
- Upload a správa dokumentov
- Automatické kategorizácie

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Clerk
- **Storage:** Supabase
- **UI:** React 19, Tailwind CSS 4, shadcn/ui
- **Grafy:** Recharts
- **Email:** Resend
- **SMS:** Twilio
- **Testing:** Vitest, Playwright
- **CI/CD:** GitHub Actions
- **Deploy:** Vercel

## 📦 Installation

### Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database
- Clerk account
- Supabase account

### Setup

1. **Clone repository**
```bash
git clone <repository-url>
cd nafinancuj-sk
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nafinancuj

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend (Email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@nafinancuj.sk

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+421...

# Vercel Cron
CRON_SECRET=your-random-secret-string
```

4. **Setup database**
```bash
pnpm db:push
```

5. **Seed demo data (optional)**
```bash
pnpm db:seed
```

6. **Run development server**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🧪 Testing

### Unit Tests
```bash
# Run once
pnpm test:unit

# Watch mode
pnpm test:watch

# With UI
pnpm test:ui

# Coverage
pnpm test:coverage
```

### E2E Tests
```bash
# Run E2E tests
pnpm test:e2e

# With UI
pnpm test:e2e:ui
```

### All checks
```bash
pnpm ci
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript check |
| `pnpm test:unit` | Run unit tests |
| `pnpm test:e2e` | Run E2E tests |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:seed` | Seed demo data |
| `pnpm ci` | Run all checks (CI) |

## 🏗️ Project Structure

```
nafinancuj-sk/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── applications/
│   │   │   ├── clients/
│   │   │   ├── contracts/
│   │   │   ├── loans/
│   │   │   ├── payments/
│   │   │   └── reminders/
│   │   ├── dashboard/         # Dashboard pages
│   │   │   ├── admin/        # Super Admin
│   │   │   └── reminders/    # Reminders management
│   │   └── sign-in/          # Auth pages
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   └── providers.tsx     # React Query provider
│   ├── db/
│   │   ├── schema/           # Drizzle schemas
│   │   └── index.ts          # Database client
│   ├── lib/
│   │   ├── services/         # Business logic
│   │   ├── validators/       # Zod schemas
│   │   ├── auth.ts           # Auth helpers
│   │   └── utils.ts          # Utilities
│   ├── scripts/
│   │   └── seed.ts           # Seed script
│   └── test/
│       ├── setup.ts          # Test setup
│       └── e2e/              # E2E tests
├── .github/
│   └── workflows/
│       └── ci.yml            # CI/CD pipeline
├── vitest.config.ts          # Vitest config
├── playwright.config.ts      # Playwright config
└── vercel.json               # Vercel config (Cron)
```

## 🔐 Security

### Implemented
- ✅ Clerk authentication
- ✅ RBAC (Role-Based Access Control)
- ✅ Row-level security (organization_id filter)
- ✅ Zod input validation
- ✅ Rate limiting middleware
- ✅ HTTPS only (Vercel)
- ✅ Environment variables protection

### Best Practices
- Never commit `.env.local`
- Use strong passwords
- Rotate API keys regularly
- Monitor logs for suspicious activity
- Keep dependencies updated

## 📈 Performance

### Optimizations
- ✅ Next.js App Router (RSC)
- ✅ React Server Components
- ✅ Database indexes
- ✅ Query optimization (Drizzle)
- ✅ Image optimization (Next.js)
- ✅ Code splitting
- ✅ Lazy loading

### Monitoring
- Vercel Analytics
- Vercel Logs
- Database query performance

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect GitHub repository**
2. **Add environment variables** in Vercel dashboard
3. **Deploy**

```bash
vercel --prod
```

### Manual Deploy

1. **Build**
```bash
pnpm build
```

2. **Start**
```bash
pnpm start
```

## 🔄 CI/CD

GitHub Actions workflow automatically:
- Runs ESLint
- Runs TypeScript check
- Runs unit tests
- Builds application
- Deploys to Vercel (on main branch)

## 📚 Documentation

- [Reminder System Setup](./REMINDERS_SETUP.md)
- [Implementation Summary](./FINAL_IMPLEMENTATION_SUMMARY.md)
- [Project Summary](./PROJECT_SUMMARY.md)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- TypeScript strict mode
- ESLint (no warnings)
- Prettier formatting
- Unit tests for business logic
- E2E tests for critical flows

## 📄 License

Private - All rights reserved

## 👥 Team

- **Developer:** [Your Name]
- **Organization:** Nafinancuj.sk

## 🆘 Support

For issues and questions:
- GitHub Issues
- Email: support@nafinancuj.sk

## 🎯 Roadmap

### ✅ Completed
- [x] Core loan management
- [x] Reminder system
- [x] Dashboards with charts
- [x] Excel export
- [x] Testing setup
- [x] CI/CD pipeline
- [x] Rate limiting
- [x] Seed data

### 🔜 Planned
- [ ] PDF contract generator
- [ ] Template editor UI
- [ ] Agent dashboard
- [ ] WhatsApp notifications
- [ ] Advanced reporting
- [ ] Mobile app

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.com/)
- [Supabase](https://supabase.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Vercel](https://vercel.com/)

---

**Made with ❤️ for financial institutions in Slovakia**

🏦 **Nafinancuj.sk** - Automatizácia pre finančné inštitúcie
