# Sandbox

Find teammates on your campus by what they've built, not what they claim.

Sandbox is a students-only platform. Verified students post project ideas and find teammates whose skills are proven by their real GitHub work. Launching at LPU, built to support more colleges.

## Stack

| Layer | Tool |
| --- | --- |
| App | Next.js 16 (App Router, React 19) + Tailwind CSS v4 |
| Auth | Supabase Auth: Google sign-in, GitHub linked as a second identity |
| Database | Supabase Postgres with Row Level Security on every table |
| Files | Supabase Storage, private `id-cards` bucket (admins only) |
| Hosting | Vercel + Supabase Cloud |

## Run it locally

Requires Node 20+, Docker Desktop and the Supabase CLI.

```bash
npm install
supabase start          # starts Postgres, Auth, Storage; applies migrations + seed
cp .env.example .env.local
supabase status         # copy the API URL and publishable key into .env.local
npm run dev             # http://localhost:3000
```

### Test the database rules

Runs every access rule and the verify → post → invite → team flow as real users, inside one transaction that rolls back:

```bash
docker exec -i supabase_db_sandbox psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q < supabase/tests/rls_and_flows.sql
```

It ends with `ALL CHECKS PASSED`.

### Google and GitHub sign-in (local)

1. **Google**: in Google Cloud Console create an OAuth client (Web application). Authorised redirect URI: `http://127.0.0.1:54321/auth/v1/callback`.
2. **GitHub**: in GitHub → Settings → Developer settings → OAuth Apps, create an app. Callback URL: `http://127.0.0.1:54321/auth/v1/callback`.
3. Put the client IDs and secrets in `.env.local` (the `SUPABASE_AUTH_EXTERNAL_*` lines), export them, and restart: `supabase stop && supabase start`.

## Project layout

```
src/
  app/                 routes (landing, /login, /auth/callback, …)
  components/ui/       design-system primitives (Button, Badge, Panel, …)
  components/site/     header, footer, logo
  components/landing/  landing-page sections
  lib/supabase/        browser, server and proxy clients
supabase/
  migrations/          schema, RLS, functions: the source of truth for rules
  seed.sql             local seed (LPU)
```

## Rules that keep it trustworthy

- Registration numbers and ID photos live in `student_verifications`, which only the student and admins can read.
- Verification status, GitHub skills and the admin flag cannot be written by students. Column grants and security-definer functions enforce this.
- Accepting requests, forming teams and scoring matches happen in Postgres functions, never in the browser.
