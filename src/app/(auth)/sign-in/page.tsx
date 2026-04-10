'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { signIn } from '@/lib/actions/auth'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn(email, password)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success, signIn() redirects — no need to setLoading(false)
  }

  return (
    <div className="w-full max-w-sm">
      {/* Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-50">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back to RodStack.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="rounded-md border border-red-900 bg-red-950/40 px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          No account?{' '}
          <Link href="/sign-up" className="text-amber-500 hover:text-amber-400 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
