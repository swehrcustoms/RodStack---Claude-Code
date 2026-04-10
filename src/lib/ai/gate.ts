/* ============================================================
   RodStack V2 — AI Feature Gate
   Reusable guard for Server Actions that call Claude.
   Wrap any server action that touches the AI layer with
   withAIGate() to get automatic auth + quota enforcement.

   Usage:
     export const myAction = withAIGate(
       'guide_spacing_analysis',
       async (userId, tier, ...args) => {
         const result = await completeAI({ userId, ... })
         return result.content
       }
     )
   ============================================================ */

'use server'

import { createServerClient } from '@/lib/supabase/server'
import { checkQuota } from '@/lib/ai/usage'
import { tierHasFeature } from '@/lib/ai/tiers'
import type { AIFeature, PlanTier } from '@/lib/ai/tiers'

/* ---- Gate result types ---- */

export type GateSuccess<T> = { ok: true;  data: T;     tier: PlanTier }
export type GateFailure     = { ok: false; error: string; code: 'UNAUTHENTICATED' | 'QUOTA_EXCEEDED' | 'FEATURE_LOCKED' | 'INTERNAL' }
export type GateResult<T>   = GateSuccess<T> | GateFailure

/* ---- The gate wrapper ---- */

/**
 * Wrap a server action with full auth + quota enforcement.
 *
 * @param feature - The AI feature to gate
 * @param handler - Your async function receiving (userId, tier, ...originalArgs)
 *
 * Returns a function with the same signature as your handler (minus userId/tier),
 * wrapped in auth + quota checks. Always returns GateResult<T>.
 */
export function withAIGate<TArgs extends unknown[], TReturn>(
  feature: AIFeature,
  handler: (userId: string, tier: PlanTier, ...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<GateResult<TReturn>> {
  return async (...args: TArgs): Promise<GateResult<TReturn>> => {
    // Auth
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'You must be signed in to use AI features.', code: 'UNAUTHENTICATED' }
    }

    // Quota + feature check
    let quota
    try {
      quota = await checkQuota(user.id, feature)
    } catch {
      return { ok: false, error: 'Failed to verify your usage quota.', code: 'INTERNAL' }
    }

    if (!quota.allowed) {
      if (quota.reason === 'feature_not_available') {
        return {
          ok: false,
          error: `This feature requires a higher plan. Upgrade from ${quota.tier} to unlock it.`,
          code: 'FEATURE_LOCKED',
        }
      }
      return {
        ok: false,
        error: `Monthly AI limit reached (${quota.queriesLimit} queries). Resets ${new Date(quota.resetsAt).toLocaleDateString()}.`,
        code: 'QUOTA_EXCEEDED',
      }
    }

    // Execute the wrapped handler
    try {
      const data = await handler(user.id, quota.tier, ...args)
      return { ok: true, data, tier: quota.tier }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected AI error.'
      console.error(`[AI Gate] ${feature} failed:`, message)
      return { ok: false, error: message, code: 'INTERNAL' }
    }
  }
}

/* ============================================================
   PRE-BUILT GATED ACTIONS
   Ready-to-use server actions for each AI feature.
   Import these directly in your components.
   ============================================================ */

import { completeAI } from '@/lib/ai/claude'
import type { RodBuild } from '@/types/rod'

/** Ask the AI for rod builder suggestions based on current form state */
export const getRodBuilderSuggestion = withAIGate(
  'rod_builder_suggestions',
  async (userId, tier, question: string, build?: Partial<RodBuild>) => {
    const result = await completeAI({
      userId,
      feature: 'rod_builder_suggestions',
      messages: [{ role: 'user', content: question }],
      buildContext: build,
    })
    return result.content
  }
)

/** Get guide spacing analysis for a specific build */
export const getGuideSpacingAnalysis = withAIGate(
  'guide_spacing_analysis',
  async (userId, tier, build: Partial<RodBuild>, specificQuestion?: string) => {
    const question = specificQuestion
      ?? `Provide a complete guide train recommendation for this rod. Include guide count, sizes, and the REC spacing progression from tip.`

    const result = await completeAI({
      userId,
      feature: 'guide_spacing_analysis',
      messages: [{ role: 'user', content: question }],
      buildContext: build,
    })
    return result.content
  }
)

/** Get material selection recommendations */
export const getMaterialRecommendation = withAIGate(
  'material_selection',
  async (userId, tier, question: string, build?: Partial<RodBuild>) => {
    const result = await completeAI({
      userId,
      feature: 'material_selection',
      messages: [{ role: 'user', content: question }],
      buildContext: build,
    })
    return result.content
  }
)

/** Get a full build critique */
export const getBuildCritique = withAIGate(
  'build_critique',
  async (userId, tier, build: Partial<RodBuild>) => {
    const result = await completeAI({
      userId,
      feature: 'build_critique',
      messages: [{
        role: 'user',
        content: 'Please critique this rod build. Identify any spec mismatches, potential issues, and suggest improvements.',
      }],
      buildContext: build,
    })
    return result.content
  }
)

/** Get cost optimization suggestions */
export const getCostOptimization = withAIGate(
  'cost_optimization',
  async (userId, tier, build: Partial<RodBuild>, budget: number) => {
    const result = await completeAI({
      userId,
      feature: 'cost_optimization',
      messages: [{
        role: 'user',
        content: `My target budget for this build is $${budget}. What component substitutions or adjustments would you recommend to meet this budget without significantly compromising quality or performance?`,
      }],
      buildContext: build,
    })
    return result.content
  }
)
