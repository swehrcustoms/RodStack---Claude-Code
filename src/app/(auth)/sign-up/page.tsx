'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { signUp } from '@/lib/actions/auth'

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError(null)

    const result = await signUp(email, password, displayName)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // On success, signUp() redirects
  }

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-slate-800 bg-slate-800/60 p-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-50">Create account</h1>
          <p className="mt-1 text-sm text-slate-500">Start building with RodStack.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Your name"
            type="text"
            autoComplete="name"
            placeholder="Rod Builder"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            hint="How you want to appear in the app."
          />
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
            autoComplete="new-password"
            placeholder="Min. 6 characters"
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
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-amber-500 hover:text-amber-400 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
