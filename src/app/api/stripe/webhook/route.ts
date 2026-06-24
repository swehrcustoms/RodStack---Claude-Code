/* ============================================================
   RodStack V2 — Stripe Webhook Handler
   POST /api/stripe/webhook

   Syncs subscription state → Supabase profiles.
   This is the ONLY place plan_tier changes.
   All AI quota checks read from profiles.plan_tier.

   Setup in Stripe Dashboard:
     Endpoint URL: https://yourapp.com/api/stripe/webhook
     Events to listen to:
       - customer.subscription.created
       - customer.subscription.updated
       - customer.subscription.deleted
       - invoice.payment_failed
       - checkout.session.completed
   ============================================================ */

import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { PlanTier } from '@/lib/ai/tiers'

// Lazily initialized to avoid build-time failure when env vars aren't set
let _stripe: Stripe | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabaseAdmin: any = null

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  }
  return _stripe
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabaseAdmin(): any {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

/* ---- Price ID → Plan Tier Mapping ----
   Add your actual Stripe price IDs here.
   Match exactly what's in your .env.local / Vercel env vars. */
const PRICE_TO_TIER: Record<string, PlanTier> = {
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID      ?? '_']:  'pro',
  [process.env.STRIPE_PRO_ANNUAL_PRICE_ID       ?? '__']: 'pro',
  [process.env.STRIPE_BUILDER_MONTHLY_PRICE_ID  ?? '___']: 'builder',
  [process.env.STRIPE_BUILDER_ANNUAL_PRICE_ID   ?? '____']: 'builder',
  [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ?? '_____']: 'enterprise',
}

function priceToTier(priceId: string): PlanTier {
  return PRICE_TO_TIER[priceId] ?? 'free'
}

/* ---- Main handler ---- */

export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  // Verify the webhook came from Stripe
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  console.log(`[Stripe Webhook] Event: ${event.type}`)

  try {
    switch (event.type) {

      /* ---- New subscription or checkout completed ---- */
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      /* ---- Subscription created (e.g. via API, not Checkout) ---- */
      case 'customer.subscription.created':
      /* ---- Plan changed, renewed, or trial started ---- */
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpsert(subscription)
        break
      }

      /* ---- Subscription canceled or ended ---- */
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      /* ---- Payment failed — downgrade to grace period or free ---- */
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        // Ignore unhandled events
        break
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Handler error for ${event.type}:`, err)
    // Return 200 to Stripe so it doesn't retry — log and investigate separately
    return NextResponse.json({ received: true, error: 'Handler error logged.' })
  }

  return NextResponse.json({ received: true })
}

/* ---- Event handlers ---- */

/**
 * checkout.session.completed
 * Links the Stripe customer ID to a Supabase user on first purchase.
 * The user's email from Stripe is matched to profiles.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return

  const customerId     = session.customer as string
  const subscriptionId = session.subscription as string
  const customerEmail  = session.customer_details?.email

  if (!customerEmail) {
    console.warn('[Stripe Webhook] checkout.session.completed: no customer email')
    return
  }

  // Find the Supabase user by email
  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .maybeSingle()

  if (!profile) {
    console.warn(`[Stripe Webhook] No profile for email: ${customerEmail}`)
    return
  }

  // Fetch subscription to get price ID and status
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
  const priceId = subscription.items.data[0]?.price.id ?? ''
  const tier    = priceToTier(priceId)

  await getSupabaseAdmin()
    .from('profiles')
    .update({
      stripe_customer_id:    customerId,
      stripe_subscription_id: subscriptionId,
      plan_tier:             tier,
      subscription_status:   subscription.status,
    })
    .eq('id', profile.id)

  console.log(`[Stripe Webhook] User ${profile.id} → tier: ${tier}`)
}

/**
 * customer.subscription.created | customer.subscription.updated
 * Syncs the plan tier and status from the subscription object.
 */
async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId    = subscription.items.data[0]?.price.id ?? ''
  const tier       = priceToTier(priceId)
  const status     = subscription.status

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      stripe_subscription_id: subscription.id,
      plan_tier:              tier,
      subscription_status:    status,
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    throw new Error(`Failed to update profile for customer ${customerId}: ${error.message}`)
  }

  console.log(`[Stripe Webhook] Customer ${customerId} → tier: ${tier}, status: ${status}`)
}

/**
 * customer.subscription.deleted
 * Downgrades the user to free tier.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      plan_tier:           'free',
      subscription_status: 'canceled',
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    throw new Error(`Failed to downgrade customer ${customerId}: ${error.message}`)
  }

  console.log(`[Stripe Webhook] Customer ${customerId} → downgraded to free`)
}

/**
 * invoice.payment_failed
 * Marks the subscription as past_due.
 * The AI gateway treats past_due the same as free tier.
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({ subscription_status: 'past_due' })
    .eq('stripe_customer_id', customerId)

  if (error) {
    throw new Error(`Failed to set past_due for customer ${customerId}: ${error.message}`)
  }

  console.log(`[Stripe Webhook] Customer ${customerId} → past_due`)
}
