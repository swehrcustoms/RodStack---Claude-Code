'use client'

import { useState } from 'react'
import { LogOut, Settings, ChevronDown, Star } from 'lucide-react'
import { cn } from '@/lib/cn'
import { signOut } from '@/lib/actions/auth'

interface TopNavProps {
  email?: string | null
  displayName?: string | null
  planTier?: string | null
}

export function TopNav({ email, displayName, planTier }: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() ?? '?'

  const isOwner = planTier === 'enterprise' || !planTier

  return (
    <header
      className="flex h-14 items-center justify-between px-6 shrink-0"
      style={{
        background: 'rgba(12,11,9,0.92)',
        borderBottom: '1px solid rgba(232,223,208,0.12)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Left: portal breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-xs tracking-widest uppercase font-semibold"
              style={{ color: 'rgba(196,186,168,0.4)', letterSpacing: '0.2em', fontSize: '10px' }}>
          SW Custom Rods
        </span>
        <span style={{ color: 'rgba(196,186,168,0.2)' }}>/</span>
        <span className="text-xs font-medium" style={{ color: 'rgba(232,223,208,0.6)' }}>
          RodStack Portal
        </span>
      </div>

      {/* Right: user menu */}
      <div className="relative flex items-center gap-3">
        {isOwner && (
          <span
            className="hidden sm:flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase"
            style={{
              background: 'rgba(184,148,42,0.15)',
              color: '#B8942A',
              border: '1px solid rgba(184,148,42,0.3)',
              letterSpacing: '0.14em',
            }}
          >
            <Star className="h-2.5 w-2.5 fill-current" />
            Owner Access
          </span>
        )}

        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
          style={{ color: '#C4BAA8' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,223,208,0.06)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: '#B8942A', color: '#0C0B09' }}
          >
            {initials}
          </span>
          <span className="hidden sm:block text-sm font-medium max-w-[140px] truncate"
                style={{ color: '#E8DFD0' }}>
            {displayName || email || 'Steve Wehr'}
          </span>
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform duration-150', menuOpen && 'rotate-180')}
            style={{ color: 'rgba(196,186,168,0.5)' }}
          />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <div
              className="absolute right-0 top-full mt-1.5 z-50 min-w-[200px] rounded-lg py-1 shadow-xl"
              style={{
                background: '#100F0C',
                border: '1px solid rgba(232,223,208,0.18)',
              }}
              role="menu"
            >
              {/* User info */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(232,223,208,0.1)' }}>
                <p className="text-sm font-semibold truncate" style={{ color: '#E8DFD0' }}>
                  {displayName || 'Steve Wehr'}
                </p>
                <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(196,186,168,0.6)' }}>{email}</p>
                {isOwner && (
                  <p className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase mt-1.5"
                     style={{ color: '#B8942A', letterSpacing: '0.14em' }}>
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Owner / Admin — Full Access
                  </p>
                )}
              </div>

              <a
                href="/settings"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                style={{ color: '#C4BAA8' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,223,208,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="h-4 w-4" style={{ color: 'rgba(196,186,168,0.5)' }} />
                Settings
              </a>

              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: '#C4BAA8' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(232,223,208,0.04)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#C4BAA8'; e.currentTarget.style.background = 'transparent' }}
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4" style={{ color: 'rgba(196,186,168,0.5)' }} />
                  Sign out
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
