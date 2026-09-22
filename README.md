# MailForge AI

An AI-powered cold email generator and outreach workspace. Give it a prospect, your offer, and a goal — it writes a subject line, opening, body and one call to action, tuned to sound like a person, not a mail-merge.

Built as a portfolio-quality SaaS MVP with real auth, a real database, real billing, and no mock data in the core app.

**Live product surface:** landing page → sign up → generate an email → save leads and templates → track history → upgrade to Pro.

## Features

- **AI email generator** — structured prompt + JSON schema validation (Zod) so the model's output always matches what the UI expects, with an automatic one-time retry on a malformed response.
- **Leads** — save prospects with status tracking (New → Contacted → Replied → Meeting → Closed), search and filter, and generate an email pre-filled from any lead.
- **Templates** — six starter templates plus your own; a template's instructions are appended to the AI prompt.
- **History** — every generation is saved as a draft; editing and saving promotes it to `saved`. Regenerate creates a new entry without touching the original.
- **Usage limits** — Free plan: 10 generations/month, 5 leads, 3 templates. Enforced **in Postgres** (triggers + an atomic RPC function), not just in the UI, so the limit holds even if a client is compromised or a request is replayed.
- **Stripe subscriptions** — Checkout, Customer Portal, and a signature-verified webhook that is the *only* writer of subscription status.
- **Auth** — Supabase email/password with email confirmation, protected `/dashboard/*` routes via middleware, and Row Level Security on every table.

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui-style components · Supabase (Postgres, Auth, RLS) · Stripe · OpenAI API · React Hook Form + Zod · Lucide React

## Architecture

```
app/
  (marketing)/        Landing page, pricing
  (auth)/              Login, signup
  auth/callback/       Supabase email-confirmation redirect
  dashboard/           Protected app: overview, generate, leads, templates, history, settings
  api/
    generate/          Server-side OpenAI call, quota + rate limiting
    stripe/             checkout, portal, webhook
components/
  ui/                  Design-system primitives (button, dialog, input, ...)
  dashboard/ generator/ leads/ emails/ templates/ settings/ marketing/ auth/
lib/
  supabase/            server, client (browser), admin (service role), middleware
  stripe/              Stripe client, webhook → DB sync
  openai/               client, prompt, generation + validation
  actions/              Server Actions (leads, templates, emails, account)
  validations/          Zod schemas, one per form
supabase/migrations/    SQL schema, RLS policies, limit triggers, seed templates
```

Business logic lives in `lib/`; components stay focused on rendering and calling actions.

### How the AI call is protected

1. Request hits `/api/generate`. The Supabase session is verified server-side (`auth.getUser()`, never trusted from the client).
2. Plan (`free` / `active`) is read from the `subscriptions` table — never from anything the client sends.
3. `consume_generation()` (a Postgres function run with the service role) atomically checks the monthly quota **and** a 60-second rate limit, and increments the counter — this is the only place usage is written, so two concurrent requests can't both slip through.
4. OpenAI is called server-side; the API key never reaches the browser. The response is parsed and validated against a Zod schema; a bad or missing response retries once.
5. If generation fails after the quota was consumed, `release_generation()` gives the generation back so the user isn't charged for a failure.

### Row Level Security

Every table (`profiles`, `leads`, `templates`, `email_generations`, `subscriptions`, `usage`) has RLS enabled. Users can only read/write rows where `user_id = auth.uid()`. `subscriptions` and `usage` are **read-only** for users — they're written exclusively by server code using the service-role key (the Stripe webhook and the metering functions), so a client can never grant itself Pro access or reset its own quota.

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_seed_templates.sql`
3. In **Authentication → URL Configuration**, set the Site URL to your app URL and add `<your-app-url>/auth/callback` as a redirect URL.
4. Copy **Project URL**, **anon public key**, and **service_role key** (Project Settings → API) into `.env.local`.

### 2. OpenAI

Create an API key at [platform.openai.com](https://platform.openai.com/api-keys) and set `OPENAI_API_KEY`. Optionally set `OPENAI_MODEL` (Free plan) and `OPENAI_PRO_MODEL` (Pro plan) — they default to `gpt-4o-mini` and `gpt-4o`.

### 3. Stripe

1. Create a **Product** ("MailForge Pro") with a recurring **$12/month Price**; copy its Price ID into `STRIPE_PRO_PRICE_ID`.
2. Copy your **Secret key** into `STRIPE_SECRET_KEY` and the **Publishable key** into `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. For local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`, then put the printed `whsec_...` in `STRIPE_WEBHOOK_SECRET`. In production, create a webhook endpoint at `<your-app-url>/api/stripe/webhook` listening for `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.created` and `customer.subscription.deleted`.
4. Turn on the **Customer Portal** in the Stripe dashboard (Settings → Billing → Customer portal) so "Manage subscription" works.

### 4. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`, sign up, confirm your email (check the Supabase auth logs if you haven't wired up a real email provider yet), and generate your first email.

## Environment variables

See `.env.example`. `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` and `STRIPE_SECRET_KEY` are server-only — never referenced from a client component.

## Deployment (Vercel)

1. Push this repo to GitHub and import it in Vercel.
2. Add all variables from `.env.example` in Project Settings → Environment Variables, using production values (set `NEXT_PUBLIC_APP_URL` to your real domain).
3. Deploy.
4. Update the Supabase redirect URL and the Stripe webhook endpoint to point at your production domain.
5. Re-run the SQL migrations against your production Supabase project if it's separate from development.

## Scripts

```bash
npm run dev        # start the dev server
npm run build       # production build
npm run start        # run the production build
npm run lint          # ESLint
npm run typecheck  # tsc --noEmit
```

## Notes on scope

This is a portfolio MVP, not a production email-sending platform — it generates and stores email drafts; it does not send email or integrate with an SMTP/ESP provider. That would be the natural next feature to add.
