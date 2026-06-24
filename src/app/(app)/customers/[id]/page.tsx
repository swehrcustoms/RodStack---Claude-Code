import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, Phone, MapPin, FileText, Clock, Building2 } from 'lucide-react'
import { getCustomer, getCustomerBuilds } from '@/lib/actions/customers'
import { CustomerForm } from '@/components/features/customers/CustomerForm'
import { deleteCustomer } from '@/lib/actions/customers'
import { formatDate, formatCurrency } from '@/lib/format'

export const metadata: Metadata = { title: 'Customer — SW Custom Rods' }

const STATUS_COLOR: Record<string, string> = {
  intake: '#999',
  blank_prep: '#7AADDE',
  wrapping: '#B8942A',
  finishing: '#E06060',
  done: '#6FC46F',
}
const STATUS_LABEL: Record<string, string> = {
  intake: 'Intake', blank_prep: 'Blank Prep',
  wrapping: 'Wrapping', finishing: 'Finishing', done: 'Done',
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, builds] = await Promise.all([
    getCustomer(params.id),
    getCustomerBuilds(params.id),
  ])

  if (!customer) notFound()
  const c = customer!

  const totalRevenue = builds.reduce((s, b) => s + (b.sale_price ?? 0), 0)
  const activeBuilds = builds.filter(b => b.status !== 'done')
  const completedBuilds = builds.filter(b => b.status === 'done')

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back nav */}
      <Link
        href="/customers"
        className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase transition-colors"
        style={{ color: 'rgba(196,186,168,0.5)', letterSpacing: '0.1em' }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Customers
      </Link>

      {/* Customer header */}
      <div className="rounded-lg p-6" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center shrink-0 text-xl font-bold"
              style={{ background: 'rgba(184,148,42,0.15)', color: '#B8942A', fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-wide"
                style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em' }}
              >
                {c.name}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(196,186,168,0.45)' }}>
                Customer since {formatDate(c.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CustomerForm mode="edit" customer={c}>
              <button
                className="text-xs px-3 py-1.5 rounded font-semibold tracking-wide transition-colors"
                style={{ color: 'rgba(196,186,168,0.6)', border: '1px solid rgba(232,223,208,0.1)' }}
              >
                Edit
              </button>
            </CustomerForm>
            <form action={deleteCustomer.bind(null, c.id)}>
              <button
                type="submit"
                className="text-xs px-3 py-1.5 rounded font-semibold tracking-wide"
                style={{ color: 'rgba(224,96,96,0.6)', border: '1px solid rgba(224,96,96,0.2)' }}
              >
                Delete
              </button>
            </form>
          </div>
        </div>

        {/* Contact info */}
        <div className="mt-5 flex flex-wrap gap-4">
          {c.email && (
            <a
              href={`mailto:${c.email}`}
              className="flex items-center gap-2 text-sm hover:underline"
              style={{ color: '#7AADDE' }}
            >
              <Mail className="h-3.5 w-3.5" />
              {c.email}
            </a>
          )}
          {c.phone && (
            <a
              href={`tel:${c.phone}`}
              className="flex items-center gap-2 text-sm hover:underline"
              style={{ color: 'rgba(196,186,168,0.6)' }}
            >
              <Phone className="h-3.5 w-3.5" />
              {c.phone}
            </a>
          )}
          {c.address && (
            <span className="flex items-center gap-2 text-sm" style={{ color: 'rgba(196,186,168,0.6)' }}>
              <MapPin className="h-3.5 w-3.5" />
              {c.address}
            </span>
          )}
        </div>

        {c.notes && (
          <p className="mt-4 text-sm" style={{ color: 'rgba(196,186,168,0.5)', borderTop: '1px solid rgba(232,223,208,0.06)', paddingTop: '1rem' }}>
            {c.notes}
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Builds', value: builds.length },
          { label: 'Active Builds', value: activeBuilds.length },
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg p-4" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: 'rgba(196,186,168,0.45)', letterSpacing: '0.18em' }}>
              {label}
            </p>
            <p className="text-2xl font-bold" style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Build history */}
      {builds.length === 0 ? (
        <div className="rounded-lg py-12 text-center" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
          <Building2 className="mx-auto h-8 w-8 mb-3" style={{ color: 'rgba(196,186,168,0.25)' }} />
          <p className="text-sm" style={{ color: 'rgba(196,186,168,0.4)' }}>No builds for this customer yet.</p>
          <Link href="/build-queue/new" className="inline-block mt-4 text-xs font-semibold tracking-wider" style={{ color: '#B8942A' }}>
            Start a build order →
          </Link>
        </div>
      ) : (
        <>
          {activeBuilds.length > 0 && (
            <BuildList title="Active Builds" builds={activeBuilds} />
          )}
          {completedBuilds.length > 0 && (
            <BuildList title="Completed" builds={completedBuilds} dimmed />
          )}
        </>
      )}
    </div>
  )
}

function BuildList({
  title,
  builds,
  dimmed,
}: {
  title: string
  builds: Array<{
    id: string
    name: string
    rod_length: number
    power: string
    action: string
    status: string
    priority: string
    sale_price: number | null
    created_at: string
  }>
  dimmed?: boolean
}) {
  return (
    <div style={{ opacity: dimmed ? 0.65 : 1 }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-0.5 w-6" style={{ background: dimmed ? 'rgba(196,186,168,0.2)' : '#B8942A' }} />
        <h2 className="text-xs font-bold tracking-widest uppercase"
            style={{ color: dimmed ? 'rgba(196,186,168,0.4)' : 'rgba(232,223,208,0.7)', letterSpacing: '0.2em' }}>
          {title}
        </h2>
      </div>
      <div className="rounded-lg overflow-hidden" style={{ background: '#100F0C', border: '1px solid rgba(232,223,208,0.1)' }}>
        {builds.map((b, i) => {
          const color = STATUS_COLOR[b.status] ?? '#999'
          return (
            <Link key={b.id} href={`/builds/${b.id}`}>
              <div
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors"
                style={{ borderBottom: i < builds.length - 1 ? '1px solid rgba(232,223,208,0.06)' : 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232,223,208,0.02)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#E8DFD0' }}>{b.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(196,186,168,0.5)' }}>
                    {b.rod_length}′ · {b.power} · {b.action} · Started {formatDate(b.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="text-[10px] font-bold tracking-wider uppercase rounded px-2 py-0.5"
                    style={{ background: `${color}22`, color, border: `1px solid ${color}44`, letterSpacing: '0.1em' }}
                  >
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                  <p className="text-sm font-bold" style={{ color: '#E8DFD0' }}>
                    {b.sale_price ? formatCurrency(b.sale_price) : '—'}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
