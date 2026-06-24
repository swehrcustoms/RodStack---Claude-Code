/* ============================================================
   SW Custom Rods — Supabase Database Types
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
          plan_tier: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          plan_tier?: string
          created_at?: string
        }
        Update: {
          email?: string | null
          display_name?: string | null
          plan_tier?: string
          subscription_status?: string | null
        }
        Relationships: []
      }
      rod_builds: {
        Row: {
          id: string
          user_id: string
          name: string
          rod_length: number
          power: string
          action: string
          status: string
          priority: string
          due_date: string | null
          sale_price: number | null
          blank_manufacturer: string | null
          blank_model: string | null
          customer_id: string | null
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
          status?: string
          priority?: string
          due_date?: string | null
          sale_price?: number | null
          blank_manufacturer?: string | null
          blank_model?: string | null
          customer_id?: string | null
          line_rating?: string | null
          lure_rating?: string | null
          blank_material?: string | null
          guide_notes?: string | null
          build_notes?: string | null
          estimated_guide_count?: number | null
        }
        Update: {
          name?: string
          rod_length?: number
          power?: string
          action?: string
          status?: string
          priority?: string
          due_date?: string | null
          sale_price?: number | null
          blank_manufacturer?: string | null
          blank_model?: string | null
          customer_id?: string | null
          line_rating?: string | null
          lure_rating?: string | null
          blank_material?: string | null
          guide_notes?: string | null
          build_notes?: string | null
          estimated_guide_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
        }
        Update: {
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          customer_id: string | null
          build_id: string | null
          invoice_number: string
          amount: number
          status: string
          due_date: string | null
          paid_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id?: string | null
          build_id?: string | null
          invoice_number: string
          amount?: number
          status?: string
          due_date?: string | null
          notes?: string | null
        }
        Update: {
          customer_id?: string | null
          build_id?: string | null
          invoice_number?: string
          amount?: number
          status?: string
          due_date?: string | null
          paid_at?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          build_id: string
          hours: number
          activity: string
          entry_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          build_id: string
          hours: number
          activity: string
          entry_date?: string
          notes?: string | null
        }
        Update: {
          hours?: number
          activity?: string
          entry_date?: string
          notes?: string | null
        }
        Relationships: []
      }
      blanks: {
        Row: {
          id: string
          user_id: string
          manufacturer: string
          model: string
          length_ft: number | null
          power: string | null
          action: string | null
          material: string | null
          line_rating: string | null
          lure_rating: string | null
          cost: number | null
          supplier: string | null
          notes: string | null
          in_stock: boolean
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          manufacturer: string
          model: string
          length_ft?: number | null
          power?: string | null
          action?: string | null
          material?: string | null
          line_rating?: string | null
          lure_rating?: string | null
          cost?: number | null
          supplier?: string | null
          notes?: string | null
          in_stock?: boolean
          quantity?: number
        }
        Update: {
          manufacturer?: string
          model?: string
          length_ft?: number | null
          power?: string | null
          action?: string | null
          material?: string | null
          line_rating?: string | null
          lure_rating?: string | null
          cost?: number | null
          supplier?: string | null
          notes?: string | null
          in_stock?: boolean
          quantity?: number
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        }
        Update: {
          labor_cost?: number
          parts_cost?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          id: string
          user_id: string
          period: string
          query_count: number
          token_count: number
          last_query_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          period: string
          query_count?: number
          token_count?: number
        }
        Update: {
          query_count?: number
          token_count?: number
          last_query_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      increment_ai_usage: {
        Args: { p_user_id: string; p_period: string; p_tokens?: number }
        Returns: { query_count: number; token_count: number }[]
      }
      next_invoice_number: {
        Args: { p_user_id: string }
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}
