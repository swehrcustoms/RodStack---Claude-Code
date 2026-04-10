import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, Ruler, Package, FileText } from 'lucide-react'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Divider } from '@/components/ui/Divider'
import { Button } from '@/components/ui/Button'
import { DeleteBuildButton } from '@/components/features/builds/DeleteBuildButton'
import { formatDate, formatRodLength, titleCase } from '@/lib/format'
import type { RodBuild } from '@/types/rod'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: 'Build Detail' }
}

export default async function BuildDetailPage({ params }: Props) {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('rod_builds')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) notFound()

  const build = data as RodBuild

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/builds"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All builds
        </Link>
        <div className="flex items-center gap-2">
          <DeleteBuildButton buildId={build.id} />
          <Link href={`/rod-builder?edit=${build.id}`}>
            <Button variant="secondary" size="sm" iconLeft={<Edit />}>
              Edit build
            </Button>
          </Link>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-50">{build.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Last updated {formatDate(build.updated_at)} · Created {formatDate(build.created_at)}
        </p>
      </div>

      {/* Specs card */}
      <Card>
        <CardHeader>
          <CardTitle>Rod Specifications</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <SpecItem label="Length">
              <span className="font-mono text-amber-500">{formatRodLength(build.rod_length)}</span>
            </SpecItem>
            <SpecItem label="Power">
              <Badge variant="default">{titleCase(build.power)}</Badge>
            </SpecItem>
            <SpecItem label="Action">
              <Badge variant="default">{titleCase(build.action)}</Badge>
            </SpecItem>
            {build.blank_material && (
              <SpecItem label="Blank Material">
                <span className="text-sm text-slate-300">{titleCase(build.blank_material)}</span>
              </SpecItem>
            )}
            {build.line_rating && (
              <SpecItem label="Line Rating">
                <span className="text-sm text-slate-300">{build.line_rating}</span>
              </SpecItem>
            )}
            {build.lure_rating && (
              <SpecItem label="Lure Rating">
                <span className="text-sm text-slate-300">{build.lure_rating}</span>
              </SpecItem>
            )}
            {build.estimated_guide_count && (
              <SpecItem label="Est. Guides">
                <span className="font-mono text-amber-500">{build.estimated_guide_count}</span>
              </SpecItem>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {(build.guide_notes || build.build_notes) && (
        <Card>
          <CardHeader>
            <CardTitle>Build Notes</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            {build.guide_notes && (
              <NoteSection label="Guide Train Notes" content={build.guide_notes} />
            )}
            {build.guide_notes && build.build_notes && <Divider />}
            {build.build_notes && (
              <NoteSection label="Build Notes" content={build.build_notes} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function SpecItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide font-medium">{label}</p>
      {children}
    </div>
  )
}

function NoteSection({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  )
}
