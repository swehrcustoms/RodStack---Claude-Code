/* ============================================================
   RodStack V2 — useAIChat React Hook
   Client-side hook for the /api/ai/chat endpoint.
   Handles streaming, quota display, error states, and history.

   Usage:
     const { ask, reply, streaming, quota, error } = useAIChat({
       feature: 'rod_builder_suggestions',
       buildId: build.id,
     })
   ============================================================ */

'use client'

import { useState, useCallback, useRef } from 'react'
import type { AIFeature } from '@/lib/ai/tiers'

/* ---- Types ---- */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface QuotaInfo {
  tier: string
  used: number
  limit: number | null
  remaining: number | null
  resetsAt: string
}

export interface UseAIChatOptions {
  /** The feature being used — controls access check server-side */
  feature: AIFeature
  /** Optional: inject a specific build into server-side context */
  buildId?: string
  /** Cap conversation history sent to the server */
  maxHistoryLength?: number
  /** Called when a quota limit is hit */
  onQuotaExceeded?: (quota: QuotaInfo) => void
}

export interface UseAIChatReturn {
  /** Send a message and receive a response */
  ask: (message: string) => Promise<void>
  /** The latest assistant reply (streams in for Pro+ tiers) */
  reply: string
  /** Full conversation history */
  history: ChatMessage[]
  /** True while the AI is generating a response */
  streaming: boolean
  /** Current quota status (updated after each query) */
  quota: QuotaInfo | null
  /** Error message if the last request failed */
  error: string | null
  /** Clear conversation history and reset state */
  reset: () => void
}

/* ---- Hook ---- */

export function useAIChat({
  feature,
  buildId,
  maxHistoryLength = 10,
  onQuotaExceeded,
}: UseAIChatOptions): UseAIChatReturn {
  const [history, setHistory]   = useState<ChatMessage[]>([])
  const [reply, setReply]       = useState('')
  const [streaming, setStreaming] = useState(false)
  const [quota, setQuota]       = useState<QuotaInfo | null>(null)
  const [error, setError]       = useState<string | null>(null)

  // Abort controller lets us cancel in-flight requests
  const abortRef = useRef<AbortController | null>(null)

  function parseQuotaFromHeaders(headers: Headers): QuotaInfo | null {
    const used      = headers.get('X-RodStack-Queries-Used')
    const limit     = headers.get('X-RodStack-Queries-Limit')
    const remaining = headers.get('X-RodStack-Queries-Left')
    const resetsAt  = headers.get('X-RodStack-Resets-At')
    const tier      = headers.get('X-RodStack-Tier')

    if (!tier || !used) return null

    return {
      tier,
      used:      parseInt(used, 10),
      limit:     limit === 'unlimited' ? null : parseInt(limit ?? '0', 10),
      remaining: remaining === 'unlimited' ? null : parseInt(remaining ?? '0', 10),
      resetsAt:  resetsAt ?? '',
    }
  }

  const ask = useCallback(async (message: string) => {
    if (!message.trim() || streaming) return

    // Cancel any previous request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setError(null)
    setReply('')
    setStreaming(true)

    // Add user message to history immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    }
    setHistory((prev) => [...prev, userMessage])

    // Build history payload (exclude timestamps — server doesn't need them)
    const historyPayload = history
      .slice(-maxHistoryLength)
      .map(({ role, content }) => ({ role, content }))

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          message: message.trim(),
          history: historyPayload,
          feature,
          buildId,
        }),
      })

      // Update quota from headers regardless of status
      const quotaInfo = parseQuotaFromHeaders(response.headers)
      if (quotaInfo) setQuota(quotaInfo)

      // Handle errors
      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Unknown error' }))

        if (response.status === 429) {
          const q = body.quota as QuotaInfo | undefined
          if (q) {
            setQuota(q)
            onQuotaExceeded?.(q)
          }
          setError(body.error ?? 'Monthly AI limit reached.')
        } else if (response.status === 401) {
          setError('Please sign in to use AI features.')
        } else {
          setError(body.error ?? 'AI service error. Please try again.')
        }
        setStreaming(false)
        return
      }

      // ---- Streaming response (Pro+) ----
      if (response.headers.get('Transfer-Encoding') === 'chunked' ||
          response.headers.get('Content-Type')?.includes('text/plain')) {

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        if (!reader) {
          setError('Failed to read AI response.')
          setStreaming(false)
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            const chunk = decoder.decode(value, { stream: true })
            fullText += chunk
            setReply(fullText)
          }
        } finally {
          reader.releaseLock()
        }

        // Add complete assistant message to history
        if (fullText) {
          setHistory((prev) => [
            ...prev,
            { role: 'assistant', content: fullText, timestamp: new Date() },
          ])
        }

      // ---- Non-streaming response (Free tier) ----
      } else {
        const body = await response.json()
        const content = body.content ?? ''
        setReply(content)

        if (body.meta?.quota) setQuota(body.meta.quota)

        setHistory((prev) => [
          ...prev,
          { role: 'assistant', content, timestamp: new Date() },
        ])
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Connection error. Please check your internet and try again.')
    } finally {
      setStreaming(false)
    }
  }, [streaming, history, feature, buildId, maxHistoryLength, onQuotaExceeded])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setHistory([])
    setReply('')
    setError(null)
    setStreaming(false)
  }, [])

  return { ask, reply, history, streaming, quota, error, reset }
}

/* ============================================================
   useAIQuota — lightweight hook just for quota display
   Use this in the nav/header to show usage meters.
   ============================================================ */

export function useAIQuota() {
  const [quota, setQuota] = useState<QuotaInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat')
      if (res.ok) {
        const data = await res.json()
        setQuota(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return { quota, loading, refresh }
}
