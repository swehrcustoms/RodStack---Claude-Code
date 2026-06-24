'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'

export async function updateBuildStatus(buildId: string, status: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { error } = await supabase
    .from('rod_builds')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', buildId)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/build-queue')
  revalidatePath('/dashboard')
}

export async function updateBuildPriority(buildId: string, priority: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { error } = await supabase
    .from('rod_builds')
    .update({ priority, updated_at: new Date().toISOString() })
    .eq('id', buildId)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/build-queue')
}

export async function getQueueBuilds() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createServerClient()
  const { data } = await supabase
    .from('rod_builds')
    .select(`
      id, name, rod_length, power, action,
      status, priority, due_date, sale_price,
      blank_manufacturer, blank_model,
      customer_id, created_at, updated_at,
      customers(name)
    `)
    .eq('user_id', user.id)
    .order('priority', { ascending: false })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
  return data ?? []
}
