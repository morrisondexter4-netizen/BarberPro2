import { supabase } from '../supabase'
import type { Customer } from '../crm/types'

interface CustomerRow {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  notes: string
  visit_count: number
  created_at: string
}

function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    visitCount: row.visit_count,
    createdAt: row.created_at,
  }
}

function customerToRow(c: Customer): CustomerRow {
  return {
    id: c.id,
    first_name: c.firstName,
    last_name: c.lastName,
    phone: c.phone,
    email: c.email,
    notes: c.notes,
    visit_count: c.visitCount,
    created_at: c.createdAt,
  }
}

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data as CustomerRow[]).map(rowToCustomer)
}

export async function saveCustomer(customer: Customer): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .upsert(customerToRow(customer), { onConflict: 'id' })
  if (error) throw error
}

export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
): Promise<void> {
  // Build a row-shaped patch from the Customer field names
  const patch: Partial<CustomerRow> = {}
  if (updates.firstName !== undefined) patch.first_name = updates.firstName
  if (updates.lastName !== undefined) patch.last_name = updates.lastName
  if (updates.phone !== undefined) patch.phone = updates.phone
  if (updates.email !== undefined) patch.email = updates.email
  if (updates.notes !== undefined) patch.notes = updates.notes
  if (updates.visitCount !== undefined) patch.visit_count = updates.visitCount
  if (updates.createdAt !== undefined) patch.created_at = updates.createdAt

  const { error } = await supabase.from('customers').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('customers').delete().eq('id', id)
  if (error) throw error
}
