'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'

export interface CustomerFormData {
  name: string
  email: string
  phone: string
  address: string
  notes: string
}

export async function saveCustomer(form: CustomerFormData, customerId?: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const payload = {
    user_id: user.id,
    name: form.name.trim(),
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    address: form.address.trim() || null,
    notes: form.notes.trim() || null,
  }

  if (customerId) {
    const { error } = await supabase
      .from('customers')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', customerId)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('customers').insert(payload)
    if (error) throw new Error(error.message)
  }

  revalidatePath('/customers')
}

export async function deleteCustomer(id: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/customers')
}

export async function getCustomers(): Promise<CustomerRow[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createServerClient()
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })
  return (data ?? []) as CustomerRow[]
}

interface CustomerRow {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export async function getCustomer(id: string): Promise<CustomerRow | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = createServerClient()
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  return data as CustomerRow | null
}

interface CustomerBuild {
  id: string
  name: string
  rod_length: number
  power: string
  action: string
  status: string
  priority: string
  sale_price: number | null
  created_at: string
}

export async function getCustomerBuilds(customerId: string): Promise<CustomerBuild[]> {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createServerClient()
  const { data } = await supabase
    .from('rod_builds')
    .select('id, name, rod_length, power, action, status, priority, sale_price, created_at')
    .eq('customer_id', customerId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return (data ?? []) as CustomerBuild[]
}
