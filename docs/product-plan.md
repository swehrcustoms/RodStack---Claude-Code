# RodStack V2 — Product Development Plan

**Last updated:** 2026-05-31  
**Stack:** Next.js 14 · Supabase · Anthropic Claude · Stripe · Vercel  
**Branch:** `claude/rodstack-v2-mvp-O9GlN`

---

## How to Read This Plan

Each phase is a self-contained unit of work. Phases 1–3 are **blockers** — nothing runs in production until they are done. Phases 4–6 are **product** — features users pay for. Phases 7–9 are **launch** — what separates a demo from a business. Each task is marked with a status:

- `[ ]` Not started
- `[~]` In codebase but untested / not wired up
- `[x]` Done and committed

---

## Codebase Snapshot — What Is Already Built

The following is committed and on the branch. These do **not** need to be written from scratch, but most need to be **wired together, tested, and verified** before they are production-ready.

### Infrastructure
- `[x]` Next.js 14 App Router project scaffold
- `[x]` Tailwind CSS with design token system (`tokens.css`)
- `[x]` TypeScript strict config (`tsconfig.json`)
- `[x]` Supabase SSR client helpers (browser + server)
- `[x]` Next.js middleware (session refresh + auth redirect)
- `[x]` `.env.local.example` with all required variables documented
- `[~]` `package.json` — `@anthropic-ai/sdk` and `stripe` added but **not yet installed**

### Database
- `[x]` Migration 001 — `profiles`, `rod_builds`, `inventory_items`, `build_costs` + RLS + triggers
- `[x]` Migration 002 — `ai_usage` table, `plan_tier` / Stripe columns on `profiles`, `increment_ai_usage()` RPC
- `[ ]` Migrations have **not been run** against a real Supabase project

### UI Primitives (`src/components/ui/`)
- `[x]` Button (variants: primary, secondary, ghost, destructive; sizes: sm/md/lg; loading state)
- `[x]` Card / CardHeader / CardContent / CardFooter
- `[x]` Input (label, hint, error, prefix, suffix)
- `[x]` Select (native, with label/error pattern)
- `[x]` Textarea
- `[x]` Badge (default, success, warning, error, accent, muted)
- `[x]` Divider
- `[x]` EmptyState
- `[x]` PageHeader
- `[ ]` Toast / notification system — **not built**
- `[ ]` Modal / Dialog — **not built**
- `[ ]` Skeleton loaders — **not built**

### App Shell
- `[x]` Sidebar with active-state nav
- `[x]` TopNav with user avatar + sign-out dropdown

### Auth
- `[x]` Sign-in page + `signIn()` server action
- `[x]` Sign-up page + `signUp()` server action
- `[x]` Sign-out button
- `[x]` `/api/auth/callback` route for Supabase OAuth redirect
- `[ ]` Password reset flow — **not built**
- `[ ]` Email verification handling — **not built**

### App Pages
- `[x]` Dashboard (`/dashboard`) — stats, recent builds, quick actions
- `[x]` Rod Builder (`/rod-builder`) — create/edit form + guide count estimation
- `[x]` Builds list (`/builds`) — grid of BuildCard components
- `[x]` Build detail (`/builds/[id]`) — spec display + delete
- `[x]` Inventory (`/inventory`) — table + add/edit items
- `[x]` Costing (`/costing`) — per-build labor/parts cost entry
- `[x]` Settings (`/settings`) — profile form + sign-out
- `[ ]` Pricing page (`/pricing`) — **not built**
- `[ ]` Billing/subscription management — **not built**
- `[ ]` AI Chat panel (component exists as hook, no UI) — **not wired up**

### AI Layer
- `[x]` `src/lib/ai/tiers.ts` — 4-tier config (free/pro/builder/enterprise)
- `[x]` `src/lib/ai/usage.ts` — quota checking, usage recording, response headers
- `[x]` `src/lib/ai/prompts.ts` — domain system prompts (3 depth levels)
- `[x]` `src/lib/ai/claude.ts` — `completeAI()` + `streamAI()` with quota enforcement
- `[x]` `src/lib/ai/gate.ts` — `withAIGate` HOF
- `[x]` `src/app/api/ai/chat/route.ts` — POST (streaming + non-streaming) + GET (quota status)
- `[x]` `src/hooks/useAIChat.ts` — React hook for streaming chat
- `[x]` `scripts/ai_gateway.py` — Python CLI equivalent
- `[ ]` AI chat **UI component** — hook exists, no React component consuming it
- `[ ]` AI suggestions panel inside Rod Builder — **not built**
- `[ ]` Quota meter in TopNav / Settings — **not built**

### Billing
- `[x]` `src/app/api/stripe/webhook/route.ts` — syncs plan tier from all Stripe events
- `[ ]` `src/app/api/stripe/checkout/route.ts` — create Checkout Session — **not built**
- `[ ]` `src/app/api/stripe/portal/route.ts` — customer billing portal redirect — **not built**
- `[ ]` Stripe products and price IDs created in dashboard — **not done**

### Marketing
- `[x]` Landing page (`/`) with hero, features, CTAs

---

## Phase 1 — Infrastructure Setup (Blocker)

**Goal:** The app runs end-to-end in a real environment — auth works, data persists, deployments succeed.  
**Estimated effort:** 1–2 days (mostly config, not code)

### 1.1 — Install Dependencies

```bash
npm install
```

Two packages were added to `package.json` but never installed: `@anthropic-ai/sdk` and `stripe`. Nothing AI or billing-related will work until this runs.

### 1.2 — Supabase Project

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from **Project Settings → API**
3. Copy `SUPABASE_SERVICE_ROLE_KEY` from the same page (keep secret — server only)
4. Run migrations in the Supabase SQL Editor in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_ai_usage_metering.sql`
5. Verify in **Table Editor** that `profiles`, `rod_builds`, `inventory_items`, `build_costs`, and `ai_usage` tables exist with RLS enabled
6. Enable **Email auth** under **Authentication → Providers**

### 1.3 — Anthropic API Key

1. Sign in at [console.anthropic.com](https://console.anthropic.com)
2. Create an API key under **API Keys**
3. Add to `.env.local` as `ANTHROPIC_API_KEY`

### 1.4 — Stripe Configuration

1. Create a Stripe account (use test mode for development)
2. Copy `STRIPE_SECRET_KEY` (starts with `sk_test_` for dev)
3. Create products in **Stripe Dashboard → Products**:

| Product | Billing | Price ID Env Var |
|---|---|---|
| Pro | Monthly | `STRIPE_PRO_MONTHLY_PRICE_ID` |
| Pro | Annual | `STRIPE_PRO_ANNUAL_PRICE_ID` |
| Builder Pro | Monthly | `STRIPE_BUILDER_MONTHLY_PRICE_ID` |
| Builder Pro | Annual | `STRIPE_BUILDER_ANNUAL_PRICE_ID` |
| Enterprise | Monthly | `STRIPE_ENTERPRISE_MONTHLY_PRICE_ID` |

4. Create a webhook endpoint pointing to `https://your-domain.com/api/stripe/webhook`
5. Subscribe to events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
6. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`
7. For local development use `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### 1.5 — Local `.env.local`

Copy `.env.local.example` → `.env.local` and fill in all values. Verify the app starts:

```bash
npm run dev
```

Open `http://localhost:3000`, confirm landing page loads, sign up, sign in, and view the dashboard.

### 1.6 — Vercel Deployment

1. Import repo to [vercel.com](https://vercel.com)
2. Framework: **Next.js** (auto-detected)
3. Add all env vars from `.env.local` in **Project Settings → Environment Variables**
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel preview URL (update to custom domain later)
5. Deploy and verify the production URL works

**Completion criteria:** Sign-up, sign-in, dashboard load, and rod build save all work on the deployed URL.

---

## Phase 2 — Core Feature Verification

**Goal:** Every feature that is already coded works correctly, handles errors gracefully, and has no TypeScript errors.  
**Estimated effort:** 2–3 days

### 2.1 — TypeScript Audit

```bash
npm run type-check
```

Fix all errors before continuing. Common issues to expect:
- Missing `null` checks on Supabase query results
- `Stripe.Invoice` type — `customer` field type cast
- Import path mismatches

### 2.2 — Auth Flow End-to-End

Test every path:

- `[ ]` Sign-up creates a user and auto-creates a `profiles` row (via DB trigger)
- `[ ]` Sign-in redirects to `/dashboard`
- `[ ]` Unauthenticated visit to `/dashboard` redirects to `/sign-in`
- `[ ]` Sign-out clears session and redirects to `/`
- `[ ]` Middleware correctly refreshes sessions on every request

### 2.3 — Rod Builder CRUD

- `[ ]` Create a new rod build — form submits, redirects to `/builds`
- `[ ]` Edit an existing build via `?edit=<id>` query param — form pre-populates
- `[ ]` Guide count auto-calculates from rod length (e.g., 7ft → 2 guides)
- `[ ]` Delete a build from `/builds/[id]` with confirmation
- `[ ]` Build shows correctly on `/builds/[id]` detail page
- `[ ]` Validation errors show inline (name too short, invalid length)

### 2.4 — Inventory Management

- `[ ]` Add an inventory item (category, name, brand, qty, unit cost)
- `[ ]` Edit an existing item
- `[ ]` Delete an item
- `[ ]` Inventory table renders categories sorted correctly
- `[ ]` Summary tile shows correct total value calculation

### 2.5 — Costing

- `[ ]` Enter labor + parts cost for a build
- `[ ]` Costs persist and update correctly
- `[ ]` Summary totals across all builds render correctly

### 2.6 — Settings

- `[ ]` Profile name updates save correctly
- `[ ]` Changes persist on page refresh

### 2.7 — Dashboard Accuracy

- `[ ]` Stats reflect real data (build count, inventory value)
- `[ ]` Recent builds list shows latest 5 correctly
- `[ ]` Empty state shows when no data exists
- `[ ]` Quick action links navigate correctly

---

## Phase 3 — UX Foundations (Missing Primitives)

**Goal:** The app provides feedback for loading, success, and error states. These are required before any feature feels production-quality.  
**Estimated effort:** 2–3 days

### 3.1 — Toast Notification System

**File to create:** `src/components/ui/Toast.tsx` + `src/hooks/useToast.ts`

Required behavior:
- Success, error, and info variants
- Auto-dismiss after 4 seconds
- Stack up to 3 toasts
- Accessible (`role="status"`)
- Positioned bottom-right on desktop, bottom-center on mobile

**Wire into:**
- Rod build save/delete
- Inventory item save/delete
- Profile update save
- Auth errors

### 3.2 — Skeleton Loaders

**File to create:** `src/components/ui/Skeleton.tsx`

A simple animated pulse placeholder (`animate-pulse`, slate-800 bg). Create variants:
- `SkeletonText` — line of text
- `SkeletonCard` — card-shaped block
- `SkeletonTable` — rows of content

**Wire into:**
- Builds list loading state
- Dashboard stats loading state

### 3.3 — Loading States on Forms

All forms (RodBuilderForm, AddItemForm, BuildCostForm, ProfileForm) need:
- Disabled submit button while submitting
- `loading` prop on Button (spinner) during submission
- Error message display when server action fails

### 3.4 — Modal / Confirmation Dialog

**File to create:** `src/components/ui/Modal.tsx`

Required for:
- Delete build confirmation (currently uses browser `confirm()`)
- Delete inventory item confirmation

Build as a `<dialog>` element with backdrop, accessible close, and keyboard (Escape) support.

### 3.5 — Error Pages

**Files to create:**
- `src/app/not-found.tsx` — 404 page with link back to dashboard
- `src/app/error.tsx` — error boundary page for unexpected runtime errors

### 3.6 — Mobile Responsiveness Audit

Walk every page at 375px width (iPhone SE):
- `[ ]` Sidebar collapses to hamburger/drawer on mobile
- `[ ]` Dashboard stats grid wraps correctly
- `[ ]` Rod builder form is usable on mobile
- `[ ]` Tables (inventory) scroll horizontally or switch to card layout
- `[ ]` TopNav is accessible on mobile

**Note:** The current Sidebar is always-visible. A mobile drawer pattern needs to be added.

---

## Phase 4 — AI Feature Integration

**Goal:** Users can interact with Claude AI from within the app. Quota gates work. Tier differences are visible.  
**Estimated effort:** 3–4 days

### 4.1 — AI Chat Panel Component

**File to create:** `src/components/features/ai/AIChat.tsx`

Consumes the existing `useAIChat` hook. Required UI:
- Message thread (user messages right, AI messages left)
- Input box with send button
- Streaming text renders progressively as it arrives
- Quota meter below input (e.g., "47 / 300 queries used this month")
- Upgrade prompt when quota is at 90% or exceeded
- Loading indicator while streaming
- Error display with retry
- Clear history button

### 4.2 — AI Suggestions Panel in Rod Builder

**File to modify:** `src/components/features/rod-builder/RodBuilderForm.tsx`

Add a collapsible side panel that:
- Appears after a build has at least length + power + action filled in
- Has a "Get AI Suggestions" button
- Calls `rod_builder_suggestions` feature
- Sends current form state as build context
- Renders the AI response in the chat panel

### 4.3 — Build Detail AI Features

**File to modify:** `src/app/(app)/builds/[id]/page.tsx`

Add AI buttons (gated by tier):
- "Critique this build" → `build_critique` feature (Pro+)
- "Analyze guide spacing" → `guide_spacing_analysis` feature (Pro+)
- "Get material recommendations" → `material_selection` feature (Pro+)
- "Optimize cost" → `cost_optimization` feature (Builder+)

Show a lock icon with "Upgrade to Pro" tooltip for locked features on Free tier.

### 4.4 — Quota Meter in TopNav

**File to modify:** `src/components/features/app-shell/TopNav.tsx`

Add a subtle usage indicator next to the user avatar:
- Shows `X / Y queries` remaining this month
- Color: amber when < 20% remaining, red when exhausted
- Clicking opens a quota detail popover
- Fetches from `GET /api/ai/chat` on mount

### 4.5 — Quota / Plan Display in Settings

**File to modify:** `src/app/(app)/settings/page.tsx`

Add a "Plan & Usage" section:
- Current plan tier badge
- Queries used / limit this month (progress bar)
- Reset date
- Upgrade CTA for Free/Pro users
- "Manage billing" link (wires to Stripe portal — Phase 5)

---

## Phase 5 — Billing & Subscription

**Goal:** Users can upgrade, downgrade, and manage their subscription. Tier gates enforce plan limits.  
**Estimated effort:** 3–4 days

### 5.1 — Pricing Page

**File to create:** `src/app/(marketing)/pricing/page.tsx`

Four-tier pricing table:

| | Free | Pro | Builder Pro | Enterprise |
|---|---|---|---|---|
| Monthly queries | 25 | 300 | 1,500 | Unlimited |
| AI Model | Haiku | Sonnet | Sonnet | Opus |
| Streaming | No | Yes | Yes | Yes |
| Build critique | No | Yes | Yes | Yes |
| Photo analysis | No | No | Yes | Yes |
| Price | $0 | $X/mo | $X/mo | Contact |

Design requirements:
- Dark slate background matching app
- Highlight the Builder Pro tier as "Most Popular"
- Annual toggle (show annual price with discount %)
- Each tier's "Get started" / "Upgrade" CTA links to Checkout

### 5.2 — Stripe Checkout Session API Route

**File to create:** `src/app/api/stripe/checkout/route.ts`

```
POST /api/stripe/checkout
Body: { priceId: string }
Returns: { url: string }  ← Stripe Checkout URL
```

Logic:
1. Authenticate user (return 401 if not signed in)
2. Look up user's `stripe_customer_id` from `profiles`
3. If no customer ID yet, create a Stripe customer with the user's email
4. Create a `stripe.checkout.sessions.create()` with:
   - `mode: 'subscription'`
   - `customer: stripeCustomerId`
   - `line_items: [{ price: priceId, quantity: 1 }]`
   - `success_url: /settings?upgraded=true`
   - `cancel_url: /pricing`
   - `metadata: { supabase_user_id: user.id }` (belt-and-suspenders for webhook)
5. Return `{ url: session.url }`

### 5.3 — Stripe Customer Portal API Route

**File to create:** `src/app/api/stripe/portal/route.ts`

```
POST /api/stripe/portal
Returns: { url: string }  ← Stripe Portal URL
```

Logic:
1. Authenticate user
2. Fetch `stripe_customer_id` from `profiles`
3. `stripe.billingPortal.sessions.create({ customer, return_url: '/settings' })`
4. Return `{ url: session.url }`

### 5.4 — Upgrade CTA Components

**File to create:** `src/components/features/billing/UpgradePrompt.tsx`

Reusable component used throughout the app:
- Shows feature name + plan required
- "Upgrade to Pro" button → calls `/api/stripe/checkout` → redirects to Stripe
- Compact inline variant for locked AI features
- Full modal variant for quota exceeded

### 5.5 — Post-Upgrade Redirect Handling

**File to modify:** `src/app/(app)/settings/page.tsx`

Read `?upgraded=true` search param on settings page load:
- Show a success toast: "You're now on the Pro plan!"
- Clear the query param from the URL

### 5.6 — Tier Gate UI Consistency

Audit all AI feature touchpoints:
- `[ ]` Free users see "Upgrade" prompt for Pro+ features
- `[ ]` Pro users see "Upgrade" prompt for Builder+ features
- `[ ]` 429 response from `/api/ai/chat` shows quota exceeded UI (not a raw error)
- `[ ]` Feature lock is checked server-side (already done in `gate.ts`) AND client-side (for UX)

---

## Phase 6 — Production Hardening

**Goal:** The app is secure, fast, and observable in production.  
**Estimated effort:** 2–3 days

### 6.1 — Security Headers

**File to modify:** `next.config.mjs`

Add HTTP security headers:
```js
headers: async () => [{
  source: '/(.*)',
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
  ]
}]
```

### 6.2 — Rate Limiting on API Routes

The AI chat route needs rate limiting beyond the quota system (prevents quota-free abuse):

**Options (pick one):**
- Vercel's built-in rate limiting (Pro plan feature)
- `upstash/ratelimit` with Upstash Redis (free tier available)
- Simple in-memory rate limit (only works for single-instance deployments)

Recommended: `@upstash/ratelimit` — 10 requests/minute per IP on `/api/ai/chat`.

### 6.3 — Input Sanitization Audit

Review all server actions (`src/lib/actions/`) for:
- `[ ]` SQL injection — Supabase SDK parameterizes queries, low risk, but verify
- `[ ]` XSS — all user content rendered in React (auto-escaped), verify no `dangerouslySetInnerHTML`
- `[ ]` Path traversal — no file system access, not applicable
- `[ ]` Webhook payload validation — Stripe signature verified ✓, Supabase admin only on server ✓

### 6.4 — Error Monitoring

Add [Sentry](https://sentry.io) (free tier: 5k errors/month):

```bash
npx @sentry/wizard@latest -i nextjs
```

Configure:
- Capture unhandled exceptions in route handlers
- Capture failed Stripe webhook events
- Capture quota errors (should not reach Sentry — track separately)

### 6.5 — TypeScript & Lint CI

**File to create:** `.github/workflows/ci.yml`

```yaml
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
```

This blocks merges with type errors or lint violations.

### 6.6 — Bundle Size

```bash
npm run build
```

Review the `.next/analyze` output (install `@next/bundle-analyzer`). Target: initial JS < 150 kB. Common issues:
- Large icon library imports — use named imports from `lucide-react` ✓ (already doing this)
- Full `stripe` SDK loaded client-side — ensure it's server-only (already is)

### 6.7 — Environment Variable Validation

**File to create:** `src/lib/env.ts`

Add startup validation that throws on missing required env vars:

```ts
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
]
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var: ${key}`)
}
```

---

## Phase 7 — Testing

**Goal:** Confidence in the calculations, quota logic, and payment flows before real money flows through.  
**Estimated effort:** 2–3 days

### 7.1 — Testing Setup

Install Vitest (compatible with Vite + Next.js, faster than Jest):

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { environment: 'jsdom', globals: true },
})
```

### 7.2 — Unit Tests: Rod Calculations

**File to create:** `src/lib/rod/__tests__/calculations.test.ts`

| Test | Input | Expected |
|---|---|---|
| Guide count for 7ft | 7 | 1 guide (rounding: 7/5.5 = 1.27 → 1) |
| Guide count for 6ft | 6 | 1 guide |
| Guide count minimum clamp | 2ft | 5 guides |
| Guide count maximum clamp | 15ft | 20 guides (cap) |
| Length display | 7.5 | "7'6\"" |
| Length display | 7.0 | "7'0\"" |
| derivedRodValues smoke test | full form | returns all expected fields |

### 7.3 — Unit Tests: AI Tier Logic

**File to create:** `src/lib/ai/__tests__/tiers.test.ts`

| Test | Scenario | Expected |
|---|---|---|
| Free tier | 25 queries used | `queriesRemaining` = 0 |
| Free tier | 24 queries used | `queriesRemaining` = 1 |
| Enterprise tier | any usage | `queriesRemaining` = null (unlimited) |
| `tierHasFeature` | free + build_critique | false |
| `tierHasFeature` | pro + build_critique | true |
| `tierHasFeature` | free + custom_system_prompt | false |
| `tierHasFeature` | enterprise + custom_system_prompt | true |
| `currentBillingPeriod` | any date | returns 'YYYY-MM' format |

### 7.4 — Unit Tests: Validation

**File to create:** `src/lib/rod/__tests__/validation.test.ts`

| Test | Input | Expected |
|---|---|---|
| Valid spec | all fields correct | `{ valid: true }` |
| Name too short | name = "A" | error on name field |
| Invalid length | rod_length = "0" | error on rod_length |
| Length out of range | rod_length = "25" | error |
| Missing power | power = "" | error |

### 7.5 — Integration Test: Stripe Webhook

**File to create:** `src/app/api/stripe/webhook/__tests__/route.test.ts`

Mock `stripe.webhooks.constructEvent` and `supabaseAdmin`. Test:

| Test | Event | Expected DB update |
|---|---|---|
| Checkout completed | `checkout.session.completed` | Profile gets `stripe_customer_id` + `plan_tier: 'pro'` |
| Subscription updated | `customer.subscription.updated` | Profile `plan_tier` updated |
| Subscription deleted | `customer.subscription.deleted` | Profile `plan_tier: 'free'` |
| Payment failed | `invoice.payment_failed` | Profile `subscription_status: 'past_due'` |
| Bad signature | invalid header | Returns 400 |

### 7.6 — E2E Tests (Optional, High Value)

Install Playwright:

```bash
npx playwright install
```

Key flows to cover:
- `[ ]` New user signs up → sees dashboard empty state
- `[ ]` User creates a rod build → appears in builds list
- `[ ]` Free user tries AI feature → sees upgrade prompt after 25 queries

---

## Phase 8 — Marketing & SEO

**Goal:** The app is discoverable and first impressions are professional.  
**Estimated effort:** 1–2 days

### 8.1 — Meta Tags & OG Images

**File to modify:** `src/app/layout.tsx`

Add full metadata:
```ts
export const metadata: Metadata = {
  title: { default: 'RodStack', template: '%s | RodStack' },
  description: 'The operating system for custom fishing rod builders.',
  openGraph: {
    title: 'RodStack — Digital Bench Assistant',
    description: '...',
    url: 'https://rodstack.app',
    siteName: 'RodStack',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
}
```

Create `public/og-image.png` (1200×630px) — a branded dark-mode card with the logo and tagline.

### 8.2 — Sitemap

**File to create:** `src/app/sitemap.ts`

Returns static marketing pages:
- `/` (landing)
- `/pricing`
- `/sign-in`
- `/sign-up`

App pages excluded (behind auth).

### 8.3 — Robots.txt

**File to create:** `public/robots.txt`

```
User-agent: *
Disallow: /dashboard
Disallow: /rod-builder
Disallow: /builds
Disallow: /inventory
Disallow: /costing
Disallow: /settings
Sitemap: https://rodstack.app/sitemap.xml
```

### 8.4 — Landing Page Improvements

**File to modify:** `src/app/(marketing)/page.tsx`

Current landing page is functional but minimal. Add:
- `[ ]` Social proof section ("Built for rod builders, by rod builders")
- `[ ]` Feature screenshot / demo section
- `[ ]` FAQ section (free tier limits, data privacy, cancellation)
- `[ ]` Footer with links (privacy, terms, contact)

### 8.5 — Legal Pages

**Files to create:**
- `src/app/(marketing)/privacy/page.tsx` — Privacy policy
- `src/app/(marketing)/terms/page.tsx` — Terms of service

These are required before running paid ads or collecting payment information. Use a service like [Termly](https://termly.io) or [GetTerms](https://getterms.io) to generate appropriate boilerplate.

---

## Phase 9 — Launch Preparation

**Goal:** The business is operational. Users can self-serve from discovery through payment.  
**Estimated effort:** 2–3 days

### 9.1 — Onboarding Flow

New users (profile with no builds) should be guided through first steps:

1. Dashboard empty state already exists — enhance it:
   - "Welcome to RodStack" heading with user's first name
   - 3-step checklist: "Create your first build" / "Add inventory" / "Try AI suggestions"
   - Each step links to the relevant page

2. Consider a one-time modal on first login:
   - "You're on the Free plan — 25 AI queries per month"
   - "Upgrade anytime from Settings"

### 9.2 — Custom Domain

1. Add custom domain in Vercel dashboard
2. Update DNS records with registrar
3. Update `NEXT_PUBLIC_APP_URL` env var in Vercel
4. Update Stripe webhook endpoint URL
5. Update Supabase auth callback URL (`Authentication → URL Configuration → Site URL`)

### 9.3 — Analytics

Add [Plausible](https://plausible.io) (privacy-friendly, no GDPR consent banner required) or [Vercel Analytics](https://vercel.com/analytics) (already integrated with the platform):

```bash
npm install @vercel/analytics
```

Add `<Analytics />` to `src/app/layout.tsx`.

Track custom events:
- Rod build created
- AI query sent
- Upgrade CTA clicked
- Checkout started

### 9.4 — Transactional Email

Required emails (use [Resend](https://resend.com) — generous free tier, clean API):
- `[ ]` Welcome email on sign-up
- `[ ]` Subscription confirmation on upgrade
- `[ ]` Payment failed warning
- `[ ]` Subscription canceled confirmation

Supabase handles auth emails (confirmation, password reset) automatically — configure the templates under **Authentication → Email Templates**.

### 9.5 — Pre-Launch Checklist

Run through this before going live:

- `[ ]` All env vars set in Vercel production environment
- `[ ]` Supabase migrations run in production project
- `[ ]` Stripe webhook configured for production URL with correct events
- `[ ]` Stripe test mode disabled — switched to live keys
- `[ ]` Custom domain resolves to Vercel
- `[ ]` SSL certificate active (Vercel handles this automatically)
- `[ ]` Sign up, upgrade to paid plan, verify Stripe webhook fires and tier updates in DB
- `[ ]` Test `stripe listen` webhook delivery in prod by making a test purchase
- `[ ]` `npm run build` succeeds with no errors
- `[ ]` `npm run type-check` passes with 0 errors
- `[ ]` All 5 Stripe price IDs are live prices (not test prices)
- `[ ]` Privacy policy and terms pages live
- `[ ]` Robots.txt blocks app routes from indexing

---

## Summary: Build Order

```
Phase 1  Infrastructure setup          1-2 days   BLOCKER
Phase 2  Core feature verification     2-3 days   BLOCKER
Phase 3  UX foundations (Toast, etc.)  2-3 days   BLOCKER for production feel
Phase 4  AI feature integration        3-4 days   Primary differentiator
Phase 5  Billing & subscription        3-4 days   Revenue
Phase 6  Production hardening          2-3 days   Pre-launch
Phase 7  Testing                       2-3 days   Confidence
Phase 8  Marketing & SEO               1-2 days   Growth
Phase 9  Launch preparation            2-3 days   Go-live
─────────────────────────────────────────────────────
Total                                  ~22-30 days
```

The critical path is **1 → 2 → 3 → 4 → 5 → launch**. Phases 6–9 can run in parallel with Phase 5 once billing is partially working.

---

## Key Files Reference

| Area | File |
|---|---|
| Database schema | `supabase/migrations/001_initial_schema.sql` |
| AI metering migration | `supabase/migrations/002_ai_usage_metering.sql` |
| Tier config | `src/lib/ai/tiers.ts` |
| Quota logic | `src/lib/ai/usage.ts` |
| AI gateway | `src/lib/ai/claude.ts` |
| AI gate HOF | `src/lib/ai/gate.ts` |
| Chat API route | `src/app/api/ai/chat/route.ts` |
| Stripe webhook | `src/app/api/stripe/webhook/route.ts` |
| React chat hook | `src/hooks/useAIChat.ts` |
| Python CLI | `scripts/ai_gateway.py` |
| Design tokens | `src/styles/tokens.css` |
| Env var template | `.env.local.example` |
