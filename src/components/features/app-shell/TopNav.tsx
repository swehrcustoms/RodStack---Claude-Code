'use client'

import { useState } from 'react'
import { LogOut, User, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { signOut } from '@/lib/actions/auth'

interface TopNavProps {
  email?: string | null
  displayName?: string | null
}

export function TopNav({ email, displayName }: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email?.[0]?.toUpperCase() ?? '?'

  const label = displayName || email || 'Account'

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 shrink-0">
      {/* Left: breadcrumb or page context could go here */}
      <div />

      {/* Right: user menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors duration-150',
            'text-slate-300 hover:bg-slate-800 hover:text-slate-50',
            menuOpen && 'bg-slate-800 text-slate-50'
          )}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          {/* Avatar */}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 text-xs font-semibold select-none">
            {initials}
          </span>
          <span className="hidden sm:block max-w-[160px] truncate">{label}</span>
          <ChevronDown
            className={cn('h-3.5 w-3.5 text-slate-500 transition-transform duration-150', menuOpen && 'rotate-180')}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              className="absolute right-0 top-full mt-1.5 z-50 min-w-[180px] rounded-lg border border-slate-700 bg-slate-800 shadow-lg py-1"
              role="menu"
            >
              {/* User info */}
              <div className="px-3 py-2 border-b border-slate-700">
                <p className="text-xs font-medium text-slate-300 truncate">{displayName || 'Builder'}</p>
                <p className="text-xs text-slate-500 truncate">{email}</p>
              </div>

              {/* Account item */}
              <button
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-slate-50 transition-colors"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <User className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Account
              </button>

              {/* Sign out */}
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-red-400 transition-colors"
                  role="menuitem"
                >
                  <LogOut className="h-4 w-4 text-slate-500" aria-hidden="true" />
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
