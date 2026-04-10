'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wrench,
  Package,
  Archive,
  DollarSign,
  Settings,
  Fish,
} from 'lucide-react'
import { cn } from '@/lib/cn'

const NAV_ITEMS = [
  { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Rod Builder', href: '/rod-builder',  icon: Wrench          },
  { label: 'Builds',      href: '/builds',       icon: Package         },
  { label: 'Inventory',   href: '/inventory',    icon: Archive         },
  { label: 'Costing',     href: '/costing',      icon: DollarSign      },
]

const BOTTOM_ITEMS = [
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex h-full w-[240px] flex-col bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-slate-800 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500">
          <Fish className="h-4 w-4 text-slate-900" aria-hidden="true" />
        </div>
        <span className="text-sm font-semibold text-slate-50 tracking-tight">RodStack</span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <ul className="flex flex-col gap-0.5" role="list">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isActive(href)
                    ? 'bg-slate-800 text-slate-50'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive(href) ? 'text-amber-500' : 'text-slate-500'
                  )}
                  aria-hidden="true"
                />
                {label}
                {isActive(href) && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-slate-800 py-3 px-3 shrink-0">
        <ul className="flex flex-col gap-0.5" role="list">
          {BOTTOM_ITEMS.map(({ label, href, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isActive(href)
                    ? 'bg-slate-800 text-slate-50'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive(href) ? 'text-amber-500' : 'text-slate-500'
                  )}
                  aria-hidden="true"
                />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
