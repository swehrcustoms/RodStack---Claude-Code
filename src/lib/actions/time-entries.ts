'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'

export interface TimeEntryFormData {
  build_id: string
  hours: string
  activity: string
  entry_date: string
  notes: string
}

export async function saveTimeEntry(form: TimeEntryFormData) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { error } = await supabase.from('time_entries').insert({
    user_id: user.id,
    build_id: form.build_id,
    hours: parseFloat(form.hours) || 0,
    activity: form.activity.trim(),
    entry_date: form.entry_date || new Date().toISOString().split('T')[0],
    notes: form.notes.trim() || null,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/time-tracking')
}

export async function deleteTimeEntry(id: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/time-tracking')
}

export async function getTimeEntries() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createServerClient()
  const { data } = await supabase
    .from('time_entries')
    .select(`*, rod_builds(name)`)
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
  return data ?? []
}

export async function getTimeEntriesByBuild(buildId: string) {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createServerClient()
  const { data } = await supabase
    .from('time_entries')
    .select('*')
    .eq('build_id', buildId)
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
  return data ?? []
}
