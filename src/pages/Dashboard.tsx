import { TrendingUp, Layers, ShoppingCart, Clock } from 'lucide-react'
import { TopNav } from '@/components/layout/TopNav'
import { Button } from '@/components/ui/Button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/Card'
import { cn } from '@/lib/cn'

/* ---- Stat card data ---- */
const STATS = [
  {
    label: 'Rods Built',
    value: '24',
    change: '+3 this month',
    trend: 'up' as const,
    icon: Layers,
    color: 'text-brand-600',
    bg: 'bg-brand-50',
  },
  {
    label: 'Components Used',
    value: '186',
    change: '+12 this week',
    trend: 'up' as const,
    icon: TrendingUp,
    color: 'text-success-dark',
    bg: 'bg-success-light',
  },
  {
    label: 'Pending Orders',
    value: '5',
    change: '2 arrive soon',
    trend: 'neutral' as const,
    icon: ShoppingCart,
    color: 'text-warning-dark',
    bg: 'bg-warning-light',
  },
  {
    label: 'Avg Build Time',
    value: '3.2h',
    change: '-0.4h vs last',
    trend: 'up' as const,
    icon: Clock,
    color: 'text-info-dark',
    bg: 'bg-info-light',
  },
]

/* ---- Recent rods mock data ---- */
const RECENT_RODS = [
  {
    id: '1',
    name: 'Heavy Bass Cranker',
    type: 'Casting',
    length: '7\'2"',
    power: 'Heavy',
    action: 'Moderate Fast',
    status: 'complete',
    updated: '2 days ago',
  },
  {
    id: '2',
    name: 'Finesse Drop Shot',
    type: 'Spinning',
    length: '6\'10"',
    power: 'Light',
    action: 'Fast',
    status: 'in-progress',
    updated: '5 days ago',
  },
  {
    id: '3',
    name: 'Surf Popper',
    type: 'Spinning',
    length: '9\'0"',
    power: 'Medium Heavy',
    action: 'Fast',
    status: 'draft',
    updated: '1 week ago',
  },
]

const STATUS_STYLES: Record<string, string> = {
  complete:     'bg-success-light text-success-dark',
  'in-progress': 'bg-warning-light text-warning-dark',
  draft:        'bg-surface-sunken text-text-secondary',
}

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopNav
        title="Dashboard"
        actions={
          <Button size="sm" asChild>
            <a href="/rods/build">New Rod</a>
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-6 max-w-[var(--content-max-width)] mx-auto space-y-6">

          {/* Welcome banner */}
          <div className="rounded-xl bg-gradient-to-r from-brand-700 to-brand-900 p-6 text-white flex items-center justify-between gap-4">
            <div>
              <p className="text-brand-200 text-sm font-medium mb-1">Welcome back,</p>
              <h2 className="text-2xl font-bold">John Doe</h2>
              <p className="text-brand-300 text-sm mt-1">You have 2 rods in progress. Keep building.</p>
            </div>
            <Button variant="secondary" size="sm" className="shrink-0 bg-white/10 border-white/20 text-white hover:bg-white/20">
              View all rods
            </Button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {STATS.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-text-primary">{stat.value}</p>
                      <p className={cn(
                        'mt-1 text-xs font-medium',
                        stat.trend === 'up' ? 'text-success-dark' : 'text-text-tertiary'
                      )}>
                        {stat.change}
                      </p>
                    </div>
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', stat.bg)}>
                      <Icon className={cn('h-5 w-5', stat.color)} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Recent rods */}
          <Card noPadding>
            <CardHeader divided className="px-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Rods</CardTitle>
                  <CardDescription>Your most recently edited builds</CardDescription>
                </div>
                <Button variant="ghost" size="sm">View all</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border-subtle">
                {RECENT_RODS.map((rod) => (
                  <div
                    key={rod.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-surface-sunken interactive cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{rod.name}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {rod.type} · {rod.length} · {rod.power} · {rod.action}
                      </p>
                    </div>
                    <span className={cn(
                      'shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                      STATUS_STYLES[rod.status]
                    )}>
                      {rod.status.replace('-', ' ')}
                    </span>
                    <span className="shrink-0 text-xs text-text-tertiary hidden sm:block">
                      {rod.updated}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Start a new rod build',    sub: 'Use the visual rod builder',  href: '/rods/build', cta: 'Build now' },
              { label: 'Browse components',        sub: 'Explore blanks, guides & more', href: '/components', cta: 'Browse' },
              { label: 'Track your orders',        sub: 'Check delivery status',        href: '/orders', cta: 'View orders' },
            ].map((action) => (
              <Card key={action.label} className="p-5 flex flex-col gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{action.label}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{action.sub}</p>
                </div>
                <Button variant="outline" size="sm" className="self-start" asChild>
                  <a href={action.href}>{action.cta}</a>
                </Button>
              </Card>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
