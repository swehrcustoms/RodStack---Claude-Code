/* ============================================================
   RodStack V2 — AI Chat API Route
   POST /api/ai/chat
   Supports streaming (Pro+) and non-streaming (Free).
   Auth-gated, quota-enforced, tier-routed.
   ============================================================ */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { completeAI, streamAI, QuotaExceededError, type AIMessage } from '@/lib/ai/claude'
import { checkQuota, usageHeaders } from '@/lib/ai/usage'
import { getTierConfig } from '@/lib/ai/tiers'
import type { AIFeature } from '@/lib/ai/tiers'
import type { RodBuild } from '@/types/rod'

/* ---- Request body schema ---- */
interface ChatRequestBody {
  /** The user's message */
  message: string
  /** Conversation history (exclude system messages — handled server-side) */
  history?: AIMessage[]
  /** Which AI feature is being invoked */
  feature: AIFeature
  /** Optional build ID — if provided, fetches build and injects as context */
  buildId?: string
}

/* ---- Route handler ---- */
export async function POST(request: NextRequest) {
  // 1. Authenticate
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in to use RodStack AI.' },
      { status: 401 }
    )
  }

  // 2. Parse and validate body
  let body: ChatRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    )
  }

  const { message, history = [], feature, buildId } = body

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
  }

  if (!feature) {
    return NextResponse.json({ error: 'Feature is required.' }, { status: 400 })
  }

  // 3. Pre-flight quota check (fast — avoids hitting Anthropic if over limit)
  let quota
  try {
    quota = await checkQuota(user.id, feature)
  } catch {
    return NextResponse.json({ error: 'Failed to check quota.' }, { status: 500 })
  }

  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: quota.reason === 'feature_not_available'
          ? `This feature is not available on your ${quota.tier} plan. Upgrade to unlock it.`
          : `Monthly AI limit reached (${quota.queriesLimit} queries). Your quota resets on ${new Date(quota.resetsAt).toLocaleDateString()}.`,
        quota: {
          tier:      quota.tier,
          used:      quota.queriesUsed,
          limit:     quota.queriesLimit,
          remaining: quota.queriesRemaining,
          resetsAt:  quota.resetsAt,
        },
      },
      {
        status: 429,
        headers: usageHeaders(quota),
      }
    )
  }

  // 4. Optionally fetch build context
  let buildContext: Partial<RodBuild> | undefined
  if (buildId) {
    const { data: build } = await supabase
      .from('rod_builds')
      .select('*')
      .eq('id', buildId)
      .eq('user_id', user.id)
      .maybeSingle()
    buildContext = build ?? undefined
  }

  // 5. Assemble message array (history + new user message)
  const messages: AIMessage[] = [
    ...history.slice(-10),   // Cap at last 10 messages to control token usage
    { role: 'user', content: message.trim() },
  ]

  const tierConfig = getTierConfig(quota.tier)

  // 6. Streaming path (Pro / Builder / Enterprise)
  if (tierConfig.streamingEnabled) {
    try {
      const { stream, meta } = await streamAI({
        userId:       user.id,
        feature,
        messages,
        buildContext,
      })

      // Encode text stream as SSE / plain text chunks
      const encoder = new TextEncoder()
      const encodedStream = new ReadableStream({
        async start(controller) {
          const reader = stream.getReader()
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              controller.enqueue(encoder.encode(value))
            }
          } finally {
            reader.releaseLock()
            controller.close()
          }
        },
      })

      return new Response(encodedStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no',
          ...meta.headers,
        },
      })
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        return NextResponse.json(
          { error: err.message, quota: err.status },
          { status: 429, headers: usageHeaders(err.status) }
        )
      }
      console.error('[AI Chat] Streaming error:', err)
      return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 502 })
    }
  }

  // 7. Non-streaming path (Free tier)
  try {
    const response = await completeAI({
      userId:       user.id,
      feature,
      messages,
      buildContext,
    })

    return NextResponse.json(
      {
        content: response.content,
        meta: {
          model:   response.meta.model,
          tokens:  response.meta.totalTokens,
          quota: {
            tier:      response.meta.quota.tier,
            used:      response.meta.quota.queriesUsed,
            limit:     response.meta.quota.queriesLimit,
            remaining: response.meta.quota.queriesRemaining,
            resetsAt:  response.meta.quota.resetsAt,
          },
        },
      },
      {
        status: 200,
        headers: response.meta.headers,
      }
    )
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: err.message, quota: err.status },
        { status: 429, headers: usageHeaders(err.status) }
      )
    }
    console.error('[AI Chat] Completion error:', err)
    return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 502 })
  }
}

/* ---- GET: Return current quota status ---- */
export async function GET() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const quota = await checkQuota(user.id, 'rod_builder_suggestions')

  return NextResponse.json({
    tier:      quota.tier,
    used:      quota.queriesUsed,
    limit:     quota.queriesLimit,
    remaining: quota.queriesRemaining,
    resetsAt:  quota.resetsAt,
  })
}
