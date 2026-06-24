'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ListOrdered,
  Clock,
  BookOpen,
  TrendingUp,
  Users,
  FileText,
  Package,
  Settings,
  UserCog,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/cn'

const WORKSHOP_NAV = [
  { label: 'Dashboard',     href: '/dashboard',     icon: LayoutDashboard },
  { label: 'Build Queue',   href: '/build-queue',   icon: ListOrdered     },
  { label: 'Time Tracking', href: '/time-tracking', icon: Clock           },
  { label: 'Blank Library', href: '/blank-library', icon: BookOpen        },
]

const BUSINESS_NAV = [
  { label: 'Revenue',    href: '/revenue',    icon: TrendingUp },
  { label: 'Customers',  href: '/customers',  icon: Users      },
  { label: 'Invoicing',  href: '/invoicing',  icon: FileText   },
  { label: 'Components', href: '/components', icon: Package    },
]

const ADMIN_NAV = [
  { label: 'Settings',    href: '/settings',      icon: Settings },
  { label: 'Users & Roles', href: '/settings/users', icon: UserCog },
]

interface SidebarProps {
  displayName?: string | null
  email?: string | null
}

export function Sidebar({ displayName, email }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() ?? 'SW'

  return (
    <aside
      className="flex h-full w-[240px] flex-col border-r"
      style={{ background: '#080806', borderColor: 'rgba(232,223,208,0.18)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5 shrink-0"
        style={{ borderBottom: '1px solid rgba(232,223,208,0.12)' }}
      >
        <div className="w-11 h-11 shrink-0 rounded-full overflow-hidden">
          <Image
            src="/logo-swcr-circle.png"
            alt="SW Custom Rods"
            width={44}
            height={44}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <div>
          <p className="text-xs font-bold tracking-widest uppercase leading-tight"
             style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', letterSpacing: '0.12em' }}>
            SW Custom Rods
          </p>
          <p className="text-[9px] tracking-widest uppercase"
             style={{ color: '#B8942A', letterSpacing: '0.2em', marginTop: '1px' }}>
            RodStack Portal
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin space-y-4">
        <NavSection label="Workshop" items={WORKSHOP_NAV} isActive={isActive} />
        <NavSection label="Business" items={BUSINESS_NAV} isActive={isActive} />
        <NavSection label="Admin"    items={ADMIN_NAV}    isActive={isActive} />
      </nav>

      {/* User card */}
      <div
        className="px-3 py-3 shrink-0"
        style={{ borderTop: '1px solid rgba(232,223,208,0.12)' }}
      >
        <div
          className="flex items-center gap-3 rounded-lg px-3 py-2.5"
          style={{ background: 'rgba(232,223,208,0.05)' }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: '#B8942A', color: '#0C0B09' }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: '#E8DFD0' }}>
              {displayName || email || 'Steve Wehr'}
            </p>
            <p className="flex items-center gap-1 text-[10px] tracking-wider uppercase"
               style={{ color: '#B8942A', letterSpacing: '0.12em' }}>
              <Star className="h-2.5 w-2.5 fill-current" />
              Owner / Admin
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function NavSection({
  label,
  items,
  isActive,
}: {
  label: string
  items: typeof WORKSHOP_NAV
  isActive: (href: string) => boolean
}) {
  return (
    <div>
      <p
        className="px-3 pb-1.5 text-[9px] font-bold tracking-widest uppercase"
        style={{ color: 'rgba(196,186,168,0.45)', letterSpacing: '0.22em' }}
      >
        {label}
      </p>
      <ul className="flex flex-col gap-0.5" role="list">
        {items.map(({ label: itemLabel, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
                  active ? '' : ''
                )}
                style={{
                  background: active ? 'rgba(184,148,42,0.12)' : 'transparent',
                  color: active ? '#E8DFD0' : '#C4BAA8',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(232,223,208,0.06)'
                    e.currentTarget.style.color = '#E8DFD0'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#C4BAA8'
                  }
                }}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  style={{ color: active ? '#B8942A' : 'rgba(196,186,168,0.6)' }}
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold tracking-wide" style={{ fontSize: '13px' }}>
                  {itemLabel}
                </span>
                {active && (
                  <span
                    className="ml-auto h-1.5 w-1.5 rounded-full"
                    style={{ background: '#B8942A' }}
                    aria-hidden="true"
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
