import { Bell, Search, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

interface TopNavProps {
  title?: string
  actions?: React.ReactNode
}

export function TopNav({ title, actions }: TopNavProps) {
  return (
    <header className={cn(
      'h-topnav shrink-0 flex items-center gap-4 px-6',
      'bg-surface-base border-b border-border-subtle',
      'sticky top-0 z-sticky'
    )}>
      {/* Page title */}
      {title && (
        <h1 className="text-base font-semibold text-text-primary mr-auto">
          {title}
        </h1>
      )}
      {!title && <div className="mr-auto" />}

      {/* Custom actions slot */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}

      {/* Global search */}
      <button className={cn(
        'hidden sm:flex items-center gap-2 h-8 px-3 rounded-md',
        'text-sm text-text-tertiary bg-surface-sunken border border-border',
        'hover:border-border-strong hover:text-text-secondary',
        'interactive w-48 lg:w-64'
      )}>
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 h-5 rounded text-xs bg-surface-raised border border-border font-mono text-text-tertiary">
          ⌘K
        </kbd>
      </button>

      {/* Notifications */}
      <button className={cn(
        'relative h-8 w-8 rounded-md flex items-center justify-center',
        'text-text-secondary hover:text-text-primary hover:bg-surface-sunken',
        'interactive'
      )}>
        <Bell className="h-4 w-4" />
        {/* Unread dot */}
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
      </button>

      {/* User avatar / profile */}
      <button className={cn(
        'flex items-center gap-2 h-8 px-2 rounded-md',
        'text-sm text-text-secondary hover:text-text-primary hover:bg-surface-sunken',
        'interactive'
      )}>
        <span className="h-6 w-6 rounded-full bg-brand-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
          JD
        </span>
        <span className="hidden md:block font-medium text-text-primary">John D.</span>
        <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
      </button>
    </header>
  )
}
