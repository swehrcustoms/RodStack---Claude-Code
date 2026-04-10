import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Wrench,
  Package,
  ShoppingCart,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/cn'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  badge?: number
}

const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard',    to: '/',           icon: LayoutDashboard },
  { label: 'Rod Builder',  to: '/rods/build', icon: Wrench },
  { label: 'My Rods',      to: '/rods',       icon: Layers },
  { label: 'Components',   to: '/components', icon: Package },
  { label: 'Orders',       to: '/orders',     icon: ShoppingCart },
]

const SECONDARY_NAV: NavItem[] = [
  { label: 'Team',     to: '/team',     icon: Users },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-surface-sidebar text-text-inverse border-r border-white/5',
        'transition-[width] duration-300 ease-in-out shrink-0',
        collapsed
          ? 'w-[var(--sidebar-collapsed-width)]'
          : 'w-[var(--sidebar-width)]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-topnav border-b border-white/5 shrink-0 px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">RodStack</span>
          </div>
        )}
        {collapsed && (
          <div className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <Wrench className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-0.5">
        {PRIMARY_NAV.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
            collapsed={collapsed}
            isActive={
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to)
            }
          />
        ))}

        <div className="my-3 border-t border-white/5" />

        {SECONDARY_NAV.map((item) => (
          <SidebarLink
            key={item.to}
            item={item}
            collapsed={collapsed}
            isActive={location.pathname.startsWith(item.to)}
          />
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-white/5 p-2">
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center justify-center w-full h-8 rounded-md',
            'text-neutral-400 hover:text-white hover:bg-white/10',
            'interactive'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}

interface SidebarLinkProps {
  item: NavItem
  collapsed: boolean
  isActive: boolean
}

function SidebarLink({ item, collapsed, isActive }: SidebarLinkProps) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={cn(
        'group flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium',
        'interactive',
        collapsed && 'justify-center',
        isActive
          ? 'bg-white/10 text-white'
          : 'text-neutral-400 hover:text-white hover:bg-white/5'
      )}
    >
      <Icon className={cn(
        'h-4.5 w-4.5 shrink-0',
        isActive ? 'text-brand-400' : 'text-neutral-400 group-hover:text-white'
      )} />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {!collapsed && item.badge != null && item.badge > 0 && (
        <span className="ml-auto shrink-0 h-5 min-w-5 px-1 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-medium">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </NavLink>
  )
}
