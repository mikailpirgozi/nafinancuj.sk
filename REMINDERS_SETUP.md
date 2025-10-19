# Reminder System Setup Guide

## Prehľad

Kompletný systém automatických upomienok pre omeškané splátky s podporou email a SMS notifikácií.

## Implementované funkcie ✅

### 1. API Routes

- **GET /api/reminders/policies** - Zoznam politík upomienok
- **POST /api/reminders/policies** - Vytvorenie novej politiky
- **PATCH /api/reminders/policies/[id]** - Úprava politiky
- **DELETE /api/reminders/policies/[id]** - Zmazanie politiky
- **POST /api/reminders/generate** - Manuálne/automatické generovanie upomienok

### 2. UI Dashboard

- Moderný admin panel na `/dashboard/reminders`
- Tabuľka s prehľadom všetkých politík
- Dialog formulár pre vytvorenie/úpravu politík
- Tlačidlo pre manuálne spustenie generovania upomienok
- Nápoveda s vysvetlením fungovania systému

### 3. Automatizácia

- **Vercel Cron Job** - Každý deň o 6:00 ráno (Europe/Bratislava)
- Automatická kontrola omeškajúcich splátok
- Odoslanie upomienok podľa nastavených politík
- Automatické pripočítanie poplatkov

### 4. Notifikácie

- **Email** - Resend integrácia s HTML šablónami
- **SMS** - Twilio integrácia
- Premenné v šablónach: `{{client_name}}`, `{{loan_amount}}`, `{{installment_amount}}`, `{{due_date}}`, `{{fee_amount}}`, `{{variable_symbol}}`

## Konfigurácia Environment Variables

Pridajte do `.env.local`:

```bash
# Resend (Email)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@nafinancuj.sk

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+421...

# Vercel Cron Secret
CRON_SECRET=your-random-secret-string
```

## Ako to funguje

### 1. Vytvorenie politiky upomienok

Admin vytvorí politiku s nasledujúcimi parametrami:

- **Dni po splatnosti** - Koľko dní po splatnosti sa má upomienka odoslať (napr. 7, 14, 30)
- **Typ upomienky** - EMAIL alebo SMS
- **Typ poplatku** - FIXED (fixná suma v €) alebo PERCENTAGE (% z dlžnej sumy)
- **Výška poplatku** - Suma alebo percento
- **Šablóna správy** - Text správy s premennými

### 2. Automatické generovanie (Cron Job)

Každý deň o 6:00:

1. Systém načíta všetky omeškajúce splátky (status UNPAID alebo PARTIALLY_PAID)
2. Pre každú splátku vypočíta počet dní omeškania
3. Nájde aplikovateľné politiky pre daný počet dní
4. Skontroluje, či upomienka už nebola odoslaná
5. Vytvorí reminder záznam v DB
6. Pripočíta poplatok k celkovej sume splátky
7. Odošle email/SMS notifikáciu

### 3. Manuálne spustenie

Admin môže kedykoľvek manuálne spustiť generovanie upomienok tlačidlom v UI.

## Príklady politík

### Politika 1: Prvá upomienka (7 dní)

- Dni po splatnosti: **7**
- Typ: **EMAIL**
- Poplatok: **10.00 €** (FIXED)
- Šablóna:

```
Dobrý deň {{client_name}},

upozorňujeme Vás, že splátka úveru vo výške {{installment_amount}}€ 
so splatnosťou {{due_date}} (VS: {{variable_symbol}}) nebola uhradená.

Poplatok za upomienku: {{fee_amount}}€

Prosíme o uhradenie v čo najkratšom čase.

S pozdravom,
Váš tím
```

### Politika 2: Druhá upomienka (14 dní)

- Dni po splatnosti: **14**
- Typ: **SMS**
- Poplatok: **5%** (PERCENTAGE)
- Šablóna:

```
Upomienka: Splatka {{installment_amount}}€ (VS: {{variable_symbol}}) 
po splatnosti. Poplatok: {{fee_amount}}€. Prosim uhradte.
```

### Politika 3: Finálna upomienka (30 dní)

- Dni po splatnosti: **30**
- Typ: **EMAIL**
- Poplatok: **50.00 €** (FIXED)
- Šablóna: (prísnejší text s upozornením na právne kroky)

## Technické detaily

### Dátový model

**reminder_policies**

- id, organization_id, days_after_due, reminder_type, fee_type, fee_amount, message_template

**reminders**

- id, installment_id, policy_id, sent_at, fee_charged

### Bezpečnosť

- Všetky API routes vyžadujú autentifikáciu (Clerk)
- RBAC - Iba ADMIN, OWNER, SUPER_ADMIN môžu spravovať politiky
- Cron endpoint chránený CRON_SECRET
- Row-level security - Každá organizácia vidí iba svoje politiky

### Validácia

- Zod schémy pre všetky vstupy
- TypeScript strict mode
- Všetky sumy v DB uložené v centoch (integer)

## Testing

### Manuálne testovanie

1. Vytvorte politiku v UI (`/dashboard/reminders`)
2. Vytvorte testovací úver s omeškajúcou splátkou
3. Kliknite na "Spustiť upomienky"
4. Skontrolujte konzolu pre logy odoslaných notifikácií

### Testovanie Cron Job

Lokálne testovanie:

```bash
curl -X POST http://localhost:3000/api/reminders/generate \
  -H "Authorization: Bearer your-cron-secret"
```

## Deployment na Vercel

1. Pridajte environment variables do Vercel projektu
2. Deploy - `vercel.json` automaticky nakonfiguruje cron job
3. Vercel automaticky spustí cron job každý deň o 6:00 (UTC+1)

## Monitoring

- Všetky reminders sa logujú do `reminders` tabuľky
- Chyby sa logujú do konzoly (Vercel Logs)
- Odporúčame nastaviť Sentry pre error tracking

## Ďalšie možnosti rozšírenia

- [ ] Webhook notifikácie
- [ ] WhatsApp integrácia
- [ ] Dashboard s štatistikami upomienok
- [ ] A/B testovanie šablón
- [ ] Automatické eskalácie (napr. 60 dní = právne oddelenie)

## Support

Pre otázky alebo problémy vytvorte issue v GitHub repozitári.

