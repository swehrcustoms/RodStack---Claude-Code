'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { formDataToDbPayload } from '@/lib/rod/transforms'
import type { RodFormData } from '@/types/rod'

interface SaveExtras {
  customer_id?: string | null
  sale_price?: number | null
  due_date?: string | null
  priority?: string
}

/** Save (create or update) a rod build */
export async function saveRodBuild(form: RodFormData, buildId?: string, extras?: SaveExtras) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const payload = {
    ...formDataToDbPayload(form, user.id),
    ...(extras?.customer_id !== undefined ? { customer_id: extras.customer_id || null } : {}),
    ...(extras?.sale_price !== undefined ? { sale_price: extras.sale_price } : {}),
    ...(extras?.due_date !== undefined ? { due_date: extras.due_date || null } : {}),
    ...(extras?.priority !== undefined ? { priority: extras.priority } : {}),
  }

  let result
  if (buildId) {
    result = await supabase
      .from('rod_builds')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', buildId)
      .eq('user_id', user.id)
      .select()
      .single()
  } else {
    result = await supabase.from('rod_builds').insert(payload).select().single()
  }

  if (result.error) return { error: result.error.message }

  revalidatePath('/builds')
  revalidatePath('/build-queue')
  revalidatePath('/dashboard')

  return { data: result.data }
}

/** Delete a rod build */
export async function deleteRodBuild(buildId: string) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('rod_builds')
    .delete()
    .eq('id', buildId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/builds')
  revalidatePath('/dashboard')

  return { success: true }
}

/** Fetch all builds for the current user */
export async function getRodBuilds() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: [], error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('rod_builds')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return { data: data ?? [], error: error?.message }
}

/** Fetch a single build by ID */
export async function getRodBuild(buildId: string) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: null, error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('rod_builds')
    .select('*')
    .eq('id', buildId)
    .eq('user_id', user.id)
    .single()

  return { data, error: error?.message }
}
