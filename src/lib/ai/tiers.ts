/* ============================================================
   RodStack V2 — AI Subscription Tier Configuration
   Single source of truth for plan limits, model routing,
   and feature access. Update here, enforced everywhere.
   ============================================================ */

export type PlanTier = 'free' | 'pro' | 'builder' | 'enterprise'

export type AIFeature =
  | 'rod_builder_suggestions'   // Live AI suggestions in the rod builder form
  | 'guide_spacing_analysis'    // Guide spacing / REC method analysis
  | 'material_selection'        // Blank + component material recommendations
  | 'build_critique'            // Full build review and critique
  | 'photo_analysis'            // GPT-4o vision: wrap photo QA
  | 'cost_optimization'         // AI-driven cost reduction suggestions
  | 'custom_system_prompt'      // Enterprise: BYOP (bring your own prompt)

/** Anthropic model IDs — update when new models release */
export const MODELS = {
  fast:     'claude-haiku-4-5-20251001',   // Cheapest — free tier
  balanced: 'claude-sonnet-4-6',           // Best value — pro/builder
  powerful: 'claude-opus-4-6',             // Most capable — enterprise
} as const

export type ModelKey = keyof typeof MODELS

/** Per-tier configuration */
export interface TierConfig {
  /** Display name shown in UI */
  name: string
  /** Monthly query limit (null = unlimited) */
  monthlyQueryLimit: number | null
  /** Max output tokens per response */
  maxOutputTokens: number
  /** Anthropic model to use */
  model: string
  /** Whether streaming is enabled for this tier */
  streamingEnabled: boolean
  /** AI features unlocked on this tier */
  features: AIFeature[]
  /** System prompt context depth (higher = more rod-building context injected) */
  contextDepth: 'minimal' | 'standard' | 'full'
  /** Stripe price IDs — set these in your Stripe dashboard */
  stripePriceIds: {
    monthly?: string
    annual?: string
  }
}

export const TIER_CONFIG: Record<PlanTier, TierConfig> = {
  free: {
    name: 'Free',
    monthlyQueryLimit: 25,
    maxOutputTokens: 512,
    model: MODELS.fast,
    streamingEnabled: false,
    contextDepth: 'minimal',
    features: [
      'rod_builder_suggestions',
    ],
    stripePriceIds: {},
  },

  pro: {
    name: 'Pro',
    monthlyQueryLimit: 300,
    maxOutputTokens: 2048,
    model: MODELS.balanced,
    streamingEnabled: true,
    contextDepth: 'standard',
    features: [
      'rod_builder_suggestions',
      'guide_spacing_analysis',
      'material_selection',
      'build_critique',
    ],
    stripePriceIds: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? '',
      annual:  process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? '',
    },
  },

  builder: {
    name: 'Builder Pro',
    monthlyQueryLimit: 1500,
    maxOutputTokens: 4096,
    model: MODELS.balanced,
    streamingEnabled: true,
    contextDepth: 'full',
    features: [
      'rod_builder_suggestions',
      'guide_spacing_analysis',
      'material_selection',
      'build_critique',
      'photo_analysis',
      'cost_optimization',
    ],
    stripePriceIds: {
      monthly: process.env.STRIPE_BUILDER_MONTHLY_PRICE_ID ?? '',
      annual:  process.env.STRIPE_BUILDER_ANNUAL_PRICE_ID ?? '',
    },
  },

  enterprise: {
    name: 'Enterprise',
    monthlyQueryLimit: null,   // Unlimited
    maxOutputTokens: 8192,
    model: MODELS.powerful,
    streamingEnabled: true,
    contextDepth: 'full',
    features: [
      'rod_builder_suggestions',
      'guide_spacing_analysis',
      'material_selection',
      'build_critique',
      'photo_analysis',
      'cost_optimization',
      'custom_system_prompt',
    ],
    stripePriceIds: {
      monthly: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ?? '',
    },
  },
}

/** Get tier config — falls back to 'free' for unknown tiers */
export function getTierConfig(tier: string): TierConfig {
  return TIER_CONFIG[tier as PlanTier] ?? TIER_CONFIG.free
}

/** Check if a tier has access to a specific AI feature */
export function tierHasFeature(tier: string, feature: AIFeature): boolean {
  return getTierConfig(tier).features.includes(feature)
}

/** Get the current billing period as YYYY-MM */
export function currentBillingPeriod(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

/** How many queries remain for a user this period */
export function queriesRemaining(
  tier: string,
  usedThisPeriod: number
): number | null {
  const limit = getTierConfig(tier).monthlyQueryLimit
  if (limit === null) return null  // Unlimited
  return Math.max(0, limit - usedThisPeriod)
}
