/* ============================================================
   RodStack V2 — Supabase Database Types
   Mirrors the actual DB schema. Keep in sync with migrations.
   ============================================================ */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          created_at?: string
        }
        Update: {
          email?: string | null
          display_name?: string | null
        }
      }
      rod_builds: {
        Row: {
          id: string
          user_id: string
          name: string
          rod_length: number
          power: string
          action: string
          line_rating: string | null
          lure_rating: string | null
          blank_material: string | null
          guide_notes: string | null
          build_notes: string | null
          estimated_guide_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          rod_length: number
          power: string
          action: string
          line_rating?: string | null
          lure_rating?: string | null
          blank_material?: string | null
          guide_notes?: string | null
          build_notes?: string | null
          estimated_guide_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          rod_length?: number
          power?: string
          action?: string
          line_rating?: string | null
          lure_rating?: string | null
          blank_material?: string | null
          guide_notes?: string | null
          build_notes?: string | null
          estimated_guide_count?: number | null
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          brand: string | null
          quantity: number
          unit_cost: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: string
          brand?: string | null
          quantity?: number
          unit_cost?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          category?: string
          brand?: string | null
          quantity?: number
          unit_cost?: number
          notes?: string | null
          updated_at?: string
        }
      }
      build_costs: {
        Row: {
          id: string
          build_id: string
          user_id: string
          labor_cost: number
          parts_cost: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          build_id: string
          user_id: string
          labor_cost?: number
          parts_cost?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          labor_cost?: number
          parts_cost?: number
          notes?: string | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
