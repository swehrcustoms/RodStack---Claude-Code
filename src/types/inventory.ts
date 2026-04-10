/* ============================================================
   RodStack V2 — Inventory Domain Types
   ============================================================ */

export type InventoryCategory =
  | 'blank'
  | 'guides'
  | 'reel-seat'
  | 'handle'
  | 'thread'
  | 'finish'
  | 'hardware'
  | 'other'

/** An inventory item — matches the inventory_items DB table */
export interface InventoryItem {
  id: string
  user_id: string
  name: string
  category: InventoryCategory
  brand: string | null
  quantity: number
  unit_cost: number
  notes: string | null
  created_at: string
  updated_at: string
}

/** Form data for adding/editing an inventory item */
export interface InventoryFormData {
  name: string
  category: string
  brand: string
  quantity: string    // string in form, parsed to number on save
  unit_cost: string   // string in form, parsed to number on save
  notes: string
}

/** Inventory summary for dashboard/costing */
export interface InventorySummary {
  totalItems: number
  totalValue: number
  byCategory: Record<string, { count: number; value: number }>
}
