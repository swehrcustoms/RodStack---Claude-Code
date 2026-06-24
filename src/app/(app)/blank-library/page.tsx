import type { Metadata } from 'next'
import { Plus, BookOpen } from 'lucide-react'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { BlankForm } from '@/components/features/blank-library/BlankForm'
import { deleteBlank } from '@/lib/actions/blanks'
import { formatCurrency } from '@/lib/format'
import type { Database } from '@/types/database'

type Blank = Database['public']['Tables']['blanks']['Row']

export const metadata: Metadata = { title: 'Blank Library — SW Custom Rods' }

export default async function BlankLibraryPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()
  const { data } = await supabase
    .from('blanks')
    .select('*')
    .eq('user_id', user.id)
    .order('manufacturer', { ascending: true })
    .order('model', { ascending: true })

  const blanks = (data ?? []) as Blank[]
  const inStock = blanks.filter(b => b.in_stock)
  const totalValue = blanks.reduce((s, b) => s + ((b.cost ?? 0) * b.quantity), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-0.5 w-8 rounded" style={{ background: '#B8942A' }} />
            <h1 className="text-2xl font-bold tracking-wider"
                style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
              Blank Library
            </h1>
          </div>
          <p className="text-sm ml-11" style={{ color: 'rgba(196,186,168,0.5)' }}>
            {blanks.length} blank{blanks.length !== 1 ? 's' : ''} · {inStock.length} in stock · {formatCurrency(totalValue)} inventory value
          </p>
        </div>
        <BlankForm mode="add">
          <Button iconLeft={<Plus className="h-4 w-4" />}>Add Blank</Button>
        </BlankForm>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Blanks', value: blanks.length },
          { label: 'In Stock', value: inStock.length },
          { label: 'Inventory Value', value: formatCurrency(totalValue) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg p-4" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(196,186,168,0.45)', letterSpacing: '0.18em' }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif" }}>{value}</p>
          </div>
        ))}
      </div>

      {blanks.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="No blanks in your library"
          description="Add rod blanks to track your inventory and quickly reference specs when building."
          action={
            <BlankForm mode="add">
              <Button iconLeft={<Plus className="h-4 w-4" />}>Add Blank</Button>
            </BlankForm>
          }
        />
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
          {/* Table header */}
          <div
            className="hidden md:grid px-5 py-2.5 text-[10px] font-bold tracking-wider uppercase"
            style={{
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px auto',
              background: 'rgba(232,223,208,0.03)',
              borderBottom: '1px solid rgba(232,223,208,0.08)',
              color: 'rgba(196,186,168,0.4)',
              letterSpacing: '0.18em',
            }}
          >
            <span>Manufacturer / Model</span>
            <span>Specs</span>
            <span>Material</span>
            <span>Ratings</span>
            <span>Cost</span>
            <span>Stock</span>
            <span>Actions</span>
          </div>

          {blanks.map((blank, i) => (
            <div
              key={blank.id}
              className="grid items-center px-5 py-4 gap-2"
              style={{
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px auto',
                borderBottom: i < blanks.length - 1 ? '1px solid rgba(232,223,208,0.06)' : 'none',
              }}
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: '#E8DFD0' }}>{blank.manufacturer}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(196,186,168,0.5)' }}>{blank.model}</p>
              </div>
              <p className="text-xs" style={{ color: 'rgba(196,186,168,0.6)' }}>
                {[blank.length_ft ? `${blank.length_ft}′` : null, blank.power, blank.action].filter(Boolean).join(' · ') || '—'}
              </p>
              <p className="text-xs" style={{ color: 'rgba(196,186,168,0.6)' }}>{blank.material ?? '—'}</p>
              <div>
                {blank.line_rating && <p className="text-xs" style={{ color: 'rgba(196,186,168,0.55)' }}>Line: {blank.line_rating}</p>}
                {blank.lure_rating && <p className="text-xs" style={{ color: 'rgba(196,186,168,0.55)' }}>Lure: {blank.lure_rating}</p>}
                {!blank.line_rating && !blank.lure_rating && <p className="text-xs" style={{ color: 'rgba(196,186,168,0.3)' }}>—</p>}
              </div>
              <p className="text-sm font-bold" style={{ color: '#E8DFD0' }}>
                {blank.cost ? formatCurrency(blank.cost) : '—'}
              </p>
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] font-bold tracking-wider uppercase rounded px-1.5 py-0.5"
                  style={{
                    background: blank.in_stock ? 'rgba(111,196,111,0.12)' : 'rgba(224,96,96,0.12)',
                    color: blank.in_stock ? '#6FC46F' : '#E06060',
                    border: `1px solid ${blank.in_stock ? 'rgba(111,196,111,0.3)' : 'rgba(224,96,96,0.3)'}`,
                    letterSpacing: '0.08em',
                  }}
                >
                  {blank.in_stock ? `${blank.quantity}` : 'Out'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <BlankForm mode="edit" blank={blank}>
                  <button className="text-xs px-2 py-1 rounded" style={{ color: 'rgba(196,186,168,0.5)' }}>Edit</button>
                </BlankForm>
                <form action={deleteBlank.bind(null, blank.id)}>
                  <button type="submit" className="text-xs px-2 py-1 rounded" style={{ color: 'rgba(224,96,96,0.45)' }}>Del</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
