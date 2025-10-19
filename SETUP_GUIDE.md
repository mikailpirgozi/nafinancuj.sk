# 🚀 Setup Guide - Nafinancuj.sk

## Problém: Internal Server Error

Aplikácia vyžaduje **Clerk authentication** credentials pre fungovanie. Bez nich sa zobrazuje "Internal Server Error".

## ✅ Riešenie: Nastavenie Clerk

### Krok 1: Vytvorte Clerk účet

1. Choďte na [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Zaregistrujte sa (zdarma pre development)
3. Vytvorte novú aplikáciu "Nafinancuj.sk"

### Krok 2: Získajte API Keys

V Clerk dashboarde:
1. Kliknite na **API Keys** v ľavom menu
2. Skopírujte:
   - **Publishable key** (začína `pk_test_...`)
   - **Secret key** (začína `sk_test_...`)

### Krok 3: Nastavte Environment Variables

Otvorte súbor `.env.local` v root priečinku projektu a vyplňte:

```env
# Clerk Authentication - VYPLŇTE SVOJE HODNOTY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_VASE_HODNOTA_SEM
CLERK_SECRET_KEY=sk_test_VASE_HODNOTA_SEM
```

### Krok 4: Reštartujte server

```bash
# Zastavte bežiaci server (Ctrl+C)
# Potom spustite znova:
pnpm dev
```

## 📊 Voliteľné: PostgreSQL Databáza

Pre plnú funkcionalitu potrebujete PostgreSQL databázu:

### Option A: Lokálna PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Vytvorte databázu
createdb nafinancuj_dev

# Nastavte v .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nafinancuj_dev
```

### Option B: Cloud PostgreSQL (Supabase)

1. Choďte na [https://supabase.com](https://supabase.com)
2. Vytvorte nový projekt
3. Skopírujte **Connection String** z Settings → Database
4. Nastavte v `.env.local`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
```

### Inicializujte databázu

```bash
pnpm db:push
pnpm db:seed  # Voliteľné: demo dáta
```

## 🗂️ Voliteľné: Supabase Storage (pre dokumenty)

1. V Supabase projekte choďte na **Storage**
2. Vytvorte bucket "documents"
3. Nastavte v `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

## 📧 Voliteľné: Email & SMS

### Resend (Email)

1. [https://resend.com](https://resend.com)
2. Získajte API key
3. Nastavte:

```env
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@nafinancuj.sk
```

### Twilio (SMS)

1. [https://twilio.com](https://twilio.com)
2. Získajte credentials
3. Nastavte:

```env
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+421xxx
```

## ✅ Kontrola

Po nastavení Clerk credentials by aplikácia mala fungovať:

```bash
pnpm dev
# Otvorte http://localhost:3000
# Mali by ste vidieť prihlasovací formulár
```

## 🆘 Stále nefunguje?

1. Skontrolujte, či sú Clerk keys správne skopírované (bez medzier)
2. Reštartujte server
3. Vyčistite cache: `rm -rf .next`
4. Skontrolujte konzolu browsera (F12) pre detailné error messages

## 📝 Minimálna konfigurácia pre štart

```env
# .env.local - MINIMUM PRE FUNGOVANIE

# Clerk (POVINNÉ)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database (POVINNÉ pre plnú funkcionalitu)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nafinancuj_dev

# Ostatné (VOLITEĽNÉ)
NEXT_PUBLIC_SUPABASE_URL=https://dummy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy-key
SUPABASE_SERVICE_ROLE_KEY=dummy-key
CRON_SECRET=development-secret-123
```

---

**Po nastavení Clerk credentials by všetko malo fungovať! 🎉**

