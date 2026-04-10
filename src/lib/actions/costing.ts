'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

/** Upsert a build cost entry */
export async function saveBuildCost(
  buildId: string,
  laborCost: number,
  partsCost: number,
  notes?: string
) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const { data: existing } = await supabase
    .from('build_costs')
    .select('id')
    .eq('build_id', buildId)
    .eq('user_id', user.id)
    .maybeSingle()

  const payload = {
    build_id: buildId,
    user_id: user.id,
    labor_cost: laborCost,
    parts_cost: partsCost,
    notes: notes?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  let result
  if (existing?.id) {
    result = await supabase
      .from('build_costs')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    result = await supabase.from('build_costs').insert(payload).select().single()
  }

  if (result.error) return { error: result.error.message }

  revalidatePath('/costing')

  return { data: result.data }
}

/** Fetch all build costs for the current user */
export async function getBuildCosts() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: [], error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('build_costs')
    .select(`
      *,
      rod_builds ( id, name, rod_length, power, action )
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return { data: data ?? [], error: error?.message }
}
