import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gbnmunfdgdnvlzcabyxf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdibm11bmZkZ2Rudmx6Y2FieXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTg5OTIsImV4cCI6MjA3Mjk3NDk5Mn0.dW5qalrprjBpW-A1SjKQ72dU-99JErIawkOuqHnVSBI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          type: 'client' | 'vendor' | 'contractor' | 'consultant'
          country: string | null
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          tax_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'client' | 'vendor' | 'contractor' | 'consultant'
          country?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          tax_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'client' | 'vendor' | 'contractor' | 'consultant'
          country?: string | null
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          tax_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          password_hash: string | null
          first_name: string
          last_name: string
          role: 'admin' | 'project_manager' | 'vendor' | 'client' | 'consultant'
          organization_id: string | null
          is_active: boolean
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash?: string | null
          first_name: string
          last_name: string
          role: 'admin' | 'project_manager' | 'vendor' | 'client' | 'consultant'
          organization_id?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string | null
          first_name?: string
          last_name?: string
          role?: 'admin' | 'project_manager' | 'vendor' | 'client' | 'consultant'
          organization_id?: string | null
          is_active?: boolean
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          client_organization_id: string
          project_manager_id: string | null
          status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          start_date: string | null
          end_date: string | null
          budget: number | null
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          client_organization_id: string
          project_manager_id?: string | null
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          client_organization_id?: string
          project_manager_id?: string | null
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      purchase_orders: {
        Row: {
          id: string
          po_number: string
          project_id: string
          vendor_organization_id: string
          title: string
          description: string | null
          total_amount: number
          currency: string
          status: 'draft' | 'issued' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled'
          issue_date: string | null
          expected_delivery_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          po_number: string
          project_id: string
          vendor_organization_id: string
          title: string
          description?: string | null
          total_amount: number
          currency?: string
          status?: 'draft' | 'issued' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled'
          issue_date?: string | null
          expected_delivery_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          po_number?: string
          project_id?: string
          vendor_organization_id?: string
          title?: string
          description?: string | null
          total_amount?: number
          currency?: string
          status?: 'draft' | 'issued' | 'acknowledged' | 'in_progress' | 'completed' | 'cancelled'
          issue_date?: string | null
          expected_delivery_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          name: string
          description: string | null
          project_id: string | null
          po_id: string | null
          template_id: string | null
          weight_percentage: number
          status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'overdue'
          due_date: string | null
          completed_date: string | null
          completion_percentage: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          project_id?: string | null
          po_id?: string | null
          template_id?: string | null
          weight_percentage: number
          status?: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'overdue'
          due_date?: string | null
          completed_date?: string | null
          completion_percentage?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          project_id?: string | null
          po_id?: string | null
          template_id?: string | null
          weight_percentage?: number
          status?: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'overdue'
          due_date?: string | null
          completed_date?: string | null
          completion_percentage?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
