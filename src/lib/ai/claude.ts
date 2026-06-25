/* ============================================================
   RodStack V2 — Claude API Gateway
   The single point of entry for all Anthropic API calls.
   Handles: tier routing, quota enforcement, streaming, recording.
   ============================================================ */

import Anthropic from '@anthropic-ai/sdk'
import { getTierConfig, tierHasFeature, type AIFeature } from '@/lib/ai/tiers'
import { checkQuota, recordUsage, usageHeaders, type QuotaStatus } from '@/lib/ai/usage'
import { buildSystemPrompt, buildContextWithBuild, type ContextDepth } from '@/lib/ai/prompts'
import type { RodBuild } from '@/types/rod'

/* ---- Anthropic client (singleton) ---- */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/* ---- Types ---- */

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIRequestOptions {
  /** The authenticated user's Supabase ID */
  userId: string
  /** The AI feature being invoked — controls access + system prompt */
  feature: AIFeature
  /** Conversation history */
  messages: AIMessage[]
  /** Optional: inject a specific build into system context */
  buildContext?: Partial<RodBuild>
  /** Override system prompt (enterprise only) */
  systemPromptOverride?: string
}

export interface AIResponseMeta {
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  quota: QuotaStatus
  headers: Record<string, string>
}

export interface AIResponse {
  content: string
  meta: AIResponseMeta
}

export class QuotaExceededError extends Error {
  constructor(public readonly status: QuotaStatus) {
    super(
      status.reason === 'feature_not_available'
        ? `This feature requires a higher plan. Upgrade to access ${status.tier} features.`
        : `Monthly AI query limit reached (${status.queriesLimit} queries). Resets ${new Date(status.resetsAt).toLocaleDateString()}.`
    )
    this.name = 'QuotaExceededError'
  }
}

/* ============================================================
   NON-STREAMING COMPLETION
   Use for: short answers, calculations, quick lookups.
   Free tier uses this (no streaming).
   ============================================================ */

export async function completeAI(options: AIRequestOptions): Promise<AIResponse> {
  const { userId, feature, messages, buildContext, systemPromptOverride } = options

  // 1. Check quota before touching Anthropic API
  const quota = await checkQuota(userId, feature)
  if (!quota.allowed) {
    throw new QuotaExceededError(quota)
  }

  const config = getTierConfig(quota.tier)

  // 2. Build system prompt (enterprise can override)
  const useOverride = systemPromptOverride && tierHasFeature(quota.tier, 'custom_system_prompt')
  const systemPrompt = useOverride
    ? systemPromptOverride!
    : buildContext
      ? buildContextWithBuild(config.contextDepth as ContextDepth, buildContext)
      : buildSystemPrompt(config.contextDepth as ContextDepth)

  // 3. Call Anthropic
  const response = await anthropic.messages.create({
    model:      config.model,
    max_tokens: config.maxOutputTokens,
    system:     systemPrompt,
    messages:   messages.map((m) => ({ role: m.role, content: m.content })),
  })

  const outputText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')

  const inputTokens  = response.usage.input_tokens
  const outputTokens = response.usage.output_tokens
  const totalTokens  = inputTokens + outputTokens

  // 4. Record usage after successful call
  await recordUsage(userId, totalTokens)

  // Refresh quota count for response headers
  const updatedQuota: QuotaStatus = {
    ...quota,
    queriesUsed:      quota.queriesUsed + 1,
    queriesRemaining: quota.queriesRemaining !== null ? quota.queriesRemaining - 1 : null,
  }

  return {
    content: outputText,
    meta: {
      model:        config.model,
      inputTokens,
      outputTokens,
      totalTokens,
      quota:        updatedQuota,
      headers:      usageHeaders(updatedQuota),
    },
  }
}

/* ============================================================
   STREAMING COMPLETION
   Use for: long-form answers, build critiques, guide train analysis.
   Pro/Builder/Enterprise tiers only.
   Returns a ReadableStream for use with Next.js StreamingTextResponse.
   ============================================================ */

export async function streamAI(
  options: AIRequestOptions
): Promise<{ stream: ReadableStream<string>; meta: AIResponseMeta }> {
  const { userId, feature, messages, buildContext, systemPromptOverride } = options

  // 1. Quota check
  const quota = await checkQuota(userId, feature)
  if (!quota.allowed) throw new QuotaExceededError(quota)

  const config = getTierConfig(quota.tier)

  if (!config.streamingEnabled) {
    throw new Error('Streaming is not available on your current plan. Upgrade to Pro or higher.')
  }

  // 2. Build system prompt
  const useOverride = systemPromptOverride && tierHasFeature(quota.tier, 'custom_system_prompt')
  const systemPrompt = useOverride
    ? systemPromptOverride!
    : buildContext
      ? buildContextWithBuild(config.contextDepth as ContextDepth, buildContext)
      : buildSystemPrompt(config.contextDepth as ContextDepth)

  // 3. Create Anthropic stream
  let totalInputTokens  = 0
  let totalOutputTokens = 0

  const anthropicStream = anthropic.messages.stream({
    model:      config.model,
    max_tokens: config.maxOutputTokens,
    system:     systemPrompt,
    messages:   messages.map((m) => ({ role: m.role, content: m.content })),
  })

  // 4. Wrap in a ReadableStream that records usage when complete
  const readable = new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const event of anthropicStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(event.delta.text)
          }

          if (event.type === 'message_delta' && event.usage) {
            totalOutputTokens = event.usage.output_tokens
          }

          if (event.type === 'message_start' && event.message.usage) {
            totalInputTokens = event.message.usage.input_tokens
          }
        }

        // Record usage after stream completes
        await recordUsage(userId, totalInputTokens + totalOutputTokens)
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  const updatedQuota: QuotaStatus = {
    ...quota,
    queriesUsed:      quota.queriesUsed + 1,
    queriesRemaining: quota.queriesRemaining !== null ? quota.queriesRemaining - 1 : null,
  }

  // Note: token counts are only accurate after stream completes.
  // We return estimated meta here; final counts written to DB asynchronously.
  return {
    stream: readable,
    meta: {
      model:        config.model,
      inputTokens:  0,   // Not yet known at stream start
      outputTokens: 0,
      totalTokens:  0,
      quota:        updatedQuota,
      headers:      usageHeaders(updatedQuota),
    },
  }
}
