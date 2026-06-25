'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient, getCurrentUser } from '@/lib/supabase/server'

export interface InvoiceFormData {
  customer_id: string
  build_id: string
  amount: string
  due_date: string
  notes: string
}

export async function saveInvoice(form: InvoiceFormData, invoiceId?: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()

  if (invoiceId) {
    const { error } = await supabase
      .from('invoices')
      .update({
        customer_id: form.customer_id || null,
        build_id: form.build_id || null,
        amount: parseFloat(form.amount) || 0,
        due_date: form.due_date || null,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId)
      .eq('user_id', user.id)
    if (error) throw new Error(error.message)
  } else {
    // Generate invoice number
    const { data: numData } = await supabase.rpc('next_invoice_number', { p_user_id: user.id })
    const invoiceNumber = (numData as string) ?? `INV-${Date.now()}`

    const { error } = await supabase.from('invoices').insert({
      user_id: user.id,
      invoice_number: invoiceNumber,
      customer_id: form.customer_id || null,
      build_id: form.build_id || null,
      amount: parseFloat(form.amount) || 0,
      due_date: form.due_date || null,
      notes: form.notes.trim() || null,
    })
    if (error) throw new Error(error.message)
  }

  revalidatePath('/invoicing')
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const update: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'paid') {
    update.paid_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('invoices')
    .update(update)
    .eq('id', invoiceId)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/invoicing')
}

export async function deleteInvoice(id: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const supabase = createServerClient()
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/invoicing')
}

export async function getInvoices() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = createServerClient()
  const { data } = await supabase
    .from('invoices')
    .select(`
      *,
      customers(name, email),
      rod_builds(name)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return data ?? []
}
