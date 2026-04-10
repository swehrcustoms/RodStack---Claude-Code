'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { InventoryFormData } from '@/types/inventory'

/** Save (create or update) an inventory item */
export async function saveInventoryItem(form: InventoryFormData, itemId?: string) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const payload = {
    user_id: user.id,
    name: form.name.trim(),
    category: form.category,
    brand: form.brand.trim() || null,
    quantity: parseInt(form.quantity, 10) || 0,
    unit_cost: parseFloat(form.unit_cost) || 0,
    notes: form.notes.trim() || null,
    updated_at: new Date().toISOString(),
  }

  let result
  if (itemId) {
    result = await supabase
      .from('inventory_items')
      .update(payload)
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select()
      .single()
  } else {
    result = await supabase.from('inventory_items').insert(payload).select().single()
  }

  if (result.error) return { error: result.error.message }

  revalidatePath('/inventory')
  revalidatePath('/costing')

  return { data: result.data }
}

/** Delete an inventory item */
export async function deleteInventoryItem(itemId: string) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/inventory')
  revalidatePath('/costing')

  return { success: true }
}

/** Fetch all inventory items for the current user */
export async function getInventoryItems() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { data: [], error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', user.id)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  return { data: data ?? [], error: error?.message }
}
