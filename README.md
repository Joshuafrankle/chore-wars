# Chore Wars

A mobile-first web app for shared houses (HMOs, student houses) that splits chores fairly. Instead of a fixed rota, an owner sets up a house (rooms, bathrooms), tenants join with an invite code, and every chore is automatically handed to whoever's contributed the least effort so far — self-correcting if someone's away, without anyone having to manually assign or nag.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Supabase** — Postgres, Auth (magic-link sign-in), Row-Level Security for multi-tenant data isolation
- **TanStack Query** — client-side data fetching/caching for the interactive chore-completion flow
- **Framer Motion** — the completion animation, leaderboard/insights bars, dialogs
- **Tailwind CSS v4** — custom design tokens, no UI framework
- **Vitest** — unit tests for the fairness-scoring and streak logic (`lib/fairness.ts`, `lib/streaks.ts`)

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up Supabase

You need a Supabase project ([supabase.com](https://supabase.com), free tier is fine).

Copy `.env.local.example` to `.env.local` and fill in your project's URL and publishable key (Supabase dashboard → **Project Settings → API**):

```bash
cp .env.local.example .env.local
```

### 3. Run the database migrations

In the Supabase SQL editor, run every file in `supabase/migrations/` **in order**:

```
0001_init.sql                    — households, profiles, chores, bills schema + RLS
0002_household_member_count.sql  — helper function for the join flow
0003_backfill_profiles.sql       — one-time fix for any pre-existing accounts missing a profile row
0004_owner_tenant_model.sql      — owner/tenant roles, bathroom groups, RLS rework
0005_rooms_and_whatsapp.sql      — room numbers, WhatsApp group link
```

### 4. Set up email sending (optional for local dev)

Supabase's built-in email sender has a very low rate limit and is only meant for light testing. For anything beyond a handful of sign-ins, configure custom SMTP: **Supabase Dashboard → Authentication → Emails → SMTP Settings**, using a provider like [Resend](https://resend.com). If you use a domain-verified sender, also add a DMARC DNS record (`_dmarc.yourdomain.com`) — without one, mail can land in spam even when correctly authenticated.

### 5. Run it

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Other commands

```bash
pnpm build   # production build
pnpm test    # run the unit tests (fairness engine, streaks)
pnpm lint    # eslint
```

## Project structure (high level)

- `app/(app)/` — the authenticated app shell (chores, tenants, insights, house management), sharing one layout with the header and bottom nav
- `app/household/`, `app/login/`, `app/auth/` — pre-authentication and household setup/onboarding flows, deliberately outside the `(app)` shell
- `app/api/chores/` — the two endpoints backing the interactive chore-completion flow (list + complete)
- `lib/fairness.ts`, `lib/streaks.ts` — pure, unit-tested business logic with no database or network calls
- `lib/chores.ts`, `lib/chores-data.ts` — the database-touching layer that feeds plain data into the pure logic above
- `supabase/migrations/` — the full schema history, run in order on a fresh project
