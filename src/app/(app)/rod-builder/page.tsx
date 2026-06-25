import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui/PageHeader'
import { RodBuilderForm } from '@/components/features/rod-builder/RodBuilderForm'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'
import { buildToFormData } from '@/lib/rod/transforms'
import type { RodBuild } from '@/types/rod'

export const metadata: Metadata = { title: 'Rod Builder' }

interface Props {
  searchParams: { edit?: string }
}

export default async function RodBuilderPage({ searchParams }: Props) {
  const editId = searchParams.edit
  let initialData = undefined
  let buildId = undefined

  if (editId) {
    const user = await getCurrentUser()
    if (user) {
      const supabase = createServerClient()
      const { data } = await supabase
        .from('rod_builds')
        .select('*')
        .eq('id', editId)
        .eq('user_id', user.id)
        .single()

      if (data) {
        initialData = buildToFormData(data as RodBuild)
        buildId = editId
      }
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={buildId ? 'Edit Build' : 'Rod Builder'}
        description={
          buildId
            ? 'Update your build specifications.'
            : 'Spec out your build. Guide count and summary update live as you fill in details.'
        }
      />
      <RodBuilderForm initialData={initialData} buildId={buildId} />
    </div>
  )
}
