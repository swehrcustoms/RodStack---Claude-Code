import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser, createServerClient } from '@/lib/supabase/server'
import { RodBuilderForm } from '@/components/features/rod-builder/RodBuilderForm'
import { getCustomers } from '@/lib/actions/customers'
import type { Database } from '@/types/database'

type RodBuild = Database['public']['Tables']['rod_builds']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

export const metadata: Metadata = { title: 'New Build Order — SW Custom Rods' }

export default async function NewBuildOrderPage({
  searchParams,
}: {
  searchParams: { edit?: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const customers = (await getCustomers()) as Customer[]

  let editBuild: RodBuild | null = null
  if (searchParams.edit) {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('rod_builds')
      .select('*')
      .eq('id', searchParams.edit)
      .eq('user_id', user.id)
      .maybeSingle()
    editBuild = data as RodBuild | null
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-0.5 w-8 rounded" style={{ background: '#B8942A' }} />
          <h1 className="text-2xl font-bold tracking-wider"
              style={{ color: '#E8DFD0', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.1em' }}>
            {editBuild ? 'Edit Build Order' : 'New Build Intake'}
          </h1>
        </div>
        <p className="text-sm ml-11" style={{ color: 'rgba(196,186,168,0.5)' }}>
          Fill in the rod specs and customer info to add to the build queue.
        </p>
      </div>
      <RodBuilderForm
        initialData={editBuild ? {
          name: editBuild.name,
          rod_length: String(editBuild.rod_length),
          power: editBuild.power,
          action: editBuild.action,
          line_rating: editBuild.line_rating ?? '',
          lure_rating: editBuild.lure_rating ?? '',
          blank_material: editBuild.blank_material ?? '',
          guide_notes: editBuild.guide_notes ?? '',
          build_notes: editBuild.build_notes ?? '',
        } : undefined}
        buildId={editBuild?.id}
        customers={customers.map(c => ({ id: c.id, name: c.name }))}
        initialCustomerId={editBuild?.customer_id ?? ''}
        initialSalePrice={editBuild?.sale_price ? String(editBuild.sale_price) : ''}
        initialDueDate={editBuild?.due_date ?? ''}
        initialPriority={editBuild?.priority ?? 'standard'}
      />
    </div>
  )
}
