'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'

export interface BlankFormData {
  manufacturer: string
  model: string
  length_ft: string
  power: string
  action: string
  material: string
  line_rating: string
  lure_rating: string
  cost: string
  supplier: string
  notes: string
  in_stock: string
  quantity: string
}

export async function saveBlank(form: BlankFormData, blankId?: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const payload = {
    user_id: user.id,
    manufacturer: form.manufacturer.trim(),
    model: form.model.trim(),
    length_ft: parseFloat(form.length_ft) || null,
    power: form.power.trim() || null,
    action: form.action.trim() || null,
    material: form.material.trim() || null,
    line_rating: form.line_rating.trim() || null,
    lure_rating: form.lure_rating.trim() || null,
    cost: parseFloat(form.cost) || null,
    supplier: form.supplier.trim() || null,
    notes: form.notes.trim() || null,
    in_stock: form.in_stock !== 'false',
    quantity: parseInt(form.quantity) || 0,
  }

  if (blankId) {
    const { error } = await supabase
      .from('blanks')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', blankId)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('blanks').insert(payload)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/blank-library')
}

export async function deleteBlank(id: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { error } = await supabase
    .from('blanks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/blank-library')
}

export async function getBlanks() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createServerClient()
  const { data } = await supabase
    .from('blanks')
    .select('*')
    .eq('user_id', user.id)
    .order('manufacturer', { ascending: true })
  return data ?? []
}
