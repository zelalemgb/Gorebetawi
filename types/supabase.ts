export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: string | null
          preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: string | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: string | null
          preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          name: string
          type: string
          category: string
          contact_person: string
          phone: string
          location: [number, number]
          address: string
          logo_url: string | null
          status: string
          rejection_reason: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          category: string
          contact_person: string
          phone: string
          location: [number, number]
          address: string
          logo_url?: string | null
          status?: string
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          category?: string
          contact_person?: string
          phone?: string
          location?: [number, number]
          address?: string
          logo_url?: string | null
          status?: string
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      reports: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          status: string
          location: [number, number]
          address: string | null
          image_url: string | null
          user_id: string | null
          anonymous: boolean
          confirmations: number
          is_sponsored: boolean
          sponsored_by: string | null
          expires_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          status?: string
          location: [number, number]
          address?: string | null
          image_url?: string | null
          user_id?: string | null
          anonymous?: boolean
          confirmations?: number
          is_sponsored?: boolean
          sponsored_by?: string | null
          expires_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          status?: string
          location?: [number, number]
          address?: string | null
          image_url?: string | null
          user_id?: string | null
          anonymous?: boolean
          confirmations?: number
          is_sponsored?: boolean
          sponsored_by?: string | null
          expires_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}