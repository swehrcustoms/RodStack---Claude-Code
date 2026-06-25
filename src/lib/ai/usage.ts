/* ============================================================
   RodStack V2 — AI Usage Tracking & Quota Enforcement
   All quota checks and usage recording flow through here.
   Uses the Supabase service-role client for atomic DB writes.
   ============================================================ */

import { createServerClient } from '@/lib/supabase/server'
import {
  getTierConfig,
  currentBillingPeriod,
  queriesRemaining,
  type PlanTier,
  type AIFeature,
} from '@/lib/ai/tiers'

/* ---- Types ---- */

export interface UsageRecord {
  queryCount: number
  tokenCount: number
  period: string
}

export interface QuotaStatus {
  allowed: boolean
  tier: PlanTier
  queriesUsed: number
  queriesLimit: number | null
  queriesRemaining: number | null
  /** ISO string of when the period resets (first of next month) */
  resetsAt: string
  /** Reason for denial, if not allowed */
  reason?: 'quota_exceeded' | 'feature_not_available' | 'subscription_inactive'
}

export interface UsageResult {
  queryCount: number
  tokenCount: number
}

/* ---- Helpers ---- */

function getPeriodResetDate(): string {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return next.toISOString()
}

/* ---- Core Functions ---- */

/**
 * Fetch the user's current plan tier from their profile.
 * Falls back to 'free' if no profile row exists yet.
 */
export async function getUserTier(userId: string): Promise<PlanTier> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('profiles')
    .select('plan_tier, subscription_status')
    .eq('id', userId)
    .maybeSingle()

  if (!data) return 'free'

  // Treat past_due or canceled subscriptions as free tier
  if (
    data.plan_tier !== 'free' &&
    data.subscription_status !== 'active' &&
    data.subscription_status !== 'trialing'
  ) {
    return 'free'
  }

  return (data.plan_tier as PlanTier) ?? 'free'
}

/**
 * Get current period usage for a user.
 * Returns zeroed record if no usage this period.
 */
export async function getCurrentUsage(userId: string): Promise<UsageRecord> {
  const supabase = createServerClient()
  const period = currentBillingPeriod()

  const { data } = await supabase
    .from('ai_usage')
    .select('query_count, token_count, period')
    .eq('user_id', userId)
    .eq('period', period)
    .maybeSingle()

  return {
    queryCount: data?.query_count ?? 0,
    tokenCount: data?.token_count ?? 0,
    period,
  }
}

/**
 * Check whether a user is allowed to make an AI query.
 * Does NOT record usage — call recordUsage() after the query succeeds.
 *
 * @param userId  - Supabase auth user ID
 * @param feature - The AI feature being requested
 */
export async function checkQuota(
  userId: string,
  feature: AIFeature
): Promise<QuotaStatus> {
  const [tier, usage] = await Promise.all([
    getUserTier(userId),
    getCurrentUsage(userId),
  ])

  const config = getTierConfig(tier)
  const period = currentBillingPeriod()
  const remaining = queriesRemaining(tier, usage.queryCount)

  // Feature access check
  if (!config.features.includes(feature)) {
    return {
      allowed: false,
      tier,
      queriesUsed: usage.queryCount,
      queriesLimit: config.monthlyQueryLimit,
      queriesRemaining: remaining,
      resetsAt: getPeriodResetDate(),
      reason: 'feature_not_available',
    }
  }

  // Quota check (skip for unlimited tiers)
  if (config.monthlyQueryLimit !== null && usage.queryCount >= config.monthlyQueryLimit) {
    return {
      allowed: false,
      tier,
      queriesUsed: usage.queryCount,
      queriesLimit: config.monthlyQueryLimit,
      queriesRemaining: 0,
      resetsAt: getPeriodResetDate(),
      reason: 'quota_exceeded',
    }
  }

  return {
    allowed: true,
    tier,
    queriesUsed: usage.queryCount,
    queriesLimit: config.monthlyQueryLimit,
    queriesRemaining: remaining,
    resetsAt: getPeriodResetDate(),
  }
}

/**
 * Atomically increment usage counters via the DB function.
 * Call this AFTER the AI query completes successfully.
 *
 * @param userId - Supabase auth user ID
 * @param tokens - Token count from the Anthropic response
 */
export async function recordUsage(
  userId: string,
  tokens: number = 0
): Promise<UsageResult> {
  const supabase = createServerClient()
  const period = currentBillingPeriod()

  const { data, error } = await supabase
    .rpc('increment_ai_usage', {
      p_user_id: userId,
      p_period:  period,
      p_tokens:  tokens,
    })
    .single()

  if (error) {
    // Non-fatal — log but don't fail the user's request
    console.error('[AI Usage] Failed to record usage:', error.message)
    return { queryCount: 0, tokenCount: 0 }
  }

  return {
    queryCount: data.query_count as number,
    tokenCount: data.token_count as number,
  }
}

/**
 * Build the HTTP response headers that communicate quota status to the client.
 * Client reads these to update the usage meter in the UI.
 */
export function usageHeaders(status: QuotaStatus): Record<string, string> {
  return {
    'X-RodStack-Tier':            status.tier,
    'X-RodStack-Queries-Used':    String(status.queriesUsed),
    'X-RodStack-Queries-Limit':   status.queriesLimit === null ? 'unlimited' : String(status.queriesLimit),
    'X-RodStack-Queries-Left':    status.queriesRemaining === null ? 'unlimited' : String(status.queriesRemaining),
    'X-RodStack-Resets-At':       status.resetsAt,
  }
}
