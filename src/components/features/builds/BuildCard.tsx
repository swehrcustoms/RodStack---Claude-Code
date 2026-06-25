import Link from 'next/link'
import { Package, ArrowRight, Calendar, Ruler } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatRodLength, titleCase } from '@/lib/format'
import type { RodBuild } from '@/types/rod'

interface BuildCardProps {
  build: RodBuild
}

export function BuildCard({ build }: BuildCardProps) {
  return (
    <Link href={`/builds/${build.id}`} className="group block">
      <Card className="hover:border-slate-600 transition-colors h-full">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-100 group-hover:text-slate-50 truncate">
                {build.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {titleCase(build.power)} · {titleCase(build.action)}
                {build.blank_material && ` · ${titleCase(build.blank_material)}`}
              </p>
            </div>
            <ArrowRight
              className="h-4 w-4 text-slate-600 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
              aria-hidden="true"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Ruler className="h-3 w-3 text-slate-600" aria-hidden="true" />
              <span className="font-mono text-slate-400">{formatRodLength(build.rod_length)}</span>
            </div>
            {build.estimated_guide_count && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Package className="h-3 w-3 text-slate-600" aria-hidden="true" />
                <span className="font-mono text-amber-500">{build.estimated_guide_count} guides est.</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            {build.line_rating ? (
              <Badge variant="muted">{build.line_rating}</Badge>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {formatDate(build.updated_at)}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
