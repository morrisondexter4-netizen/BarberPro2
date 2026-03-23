import { getSupabase } from '../supabase'
import type { ShopSettings, ShopHours } from '../types'

interface ShopSettingsRow {
  id: string
  shop_name: string
  address: string
  phone: string
  hours: Record<string, ShopHours>
}

function rowToSettings(row: ShopSettingsRow): ShopSettings {
  // ShopSettings in lib/types.ts embeds barbers and services — those are
  // managed by their own tables. We return an empty array here; callers
  // should merge with the results from getBarbers() / getServices().
  return {
    shopName: row.shop_name,
    address: row.address,
    phone: row.phone,
    hours: row.hours,
    barbers: [],
    services: [],
  }
}

export async function getShopSettings(): Promise<ShopSettings | null> {
  const { data, error } = await getSupabase()
    .from('shop_settings')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return rowToSettings(data as ShopSettingsRow)
}

export async function saveShopSettings(settings: ShopSettings): Promise<void> {
  // Fetch existing row id (if any) so we can upsert deterministically
  const { data: existing } = await getSupabase()
    .from('shop_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  const row: ShopSettingsRow = {
    id: (existing as { id: string } | null)?.id ?? crypto.randomUUID(),
    shop_name: settings.shopName,
    address: settings.address,
    phone: settings.phone,
    hours: settings.hours,
  }

  const { error } = await getSupabase()
    .from('shop_settings')
    .upsert(row, { onConflict: 'id' })
  if (error) throw error
}
