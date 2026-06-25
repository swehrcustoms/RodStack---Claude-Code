/* ============================================================
   RodStack V2 — Application Constants
   ============================================================ */

export const APP_NAME = 'RodStack'
export const APP_TAGLINE = 'The operating system for rod builders.'

export const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',    icon: 'LayoutDashboard' },
  { label: 'Rod Builder',  href: '/rod-builder',  icon: 'Wrench'          },
  { label: 'Builds',       href: '/builds',       icon: 'Package'         },
  { label: 'Inventory',    href: '/inventory',    icon: 'Archive'         },
  { label: 'Costing',      href: '/costing',      icon: 'DollarSign'      },
  { label: 'Settings',     href: '/settings',     icon: 'Settings'        },
] as const

export const ROUTES = {
  home: '/',
  signIn: '/sign-in',
  signUp: '/sign-up',
  dashboard: '/dashboard',
  rodBuilder: '/rod-builder',
  builds: '/builds',
  build: (id: string) => `/builds/${id}`,
  inventory: '/inventory',
  costing: '/costing',
  settings: '/settings',
} as const
