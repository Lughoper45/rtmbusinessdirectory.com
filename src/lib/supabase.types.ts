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
      businesses: {
        Row: {
          id: string
          business_id: string
          name: string
          category: string
          subcategory: string | null
          description: string
          image: string
          logo: string | null
          rating: number
          review_count: number
          price_range: string
          address: string
          city: string
          province: string
          distance: number | null
          is_open: boolean
          closing_time: string | null
          phone: string | null
          website: string | null
          is_verified: boolean
          is_world_cup_ready: boolean
          is_new: boolean
          is_trending: boolean
          is_award_winner: boolean
          features: string[]
          ownership: string[]
          cuisine: string | null
          recent_review_text: string | null
          recent_review_author: string | null
          recent_review_rating: number | null
          lat: number | null
          lng: number | null
          photos: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          category: string
          subcategory?: string | null
          description?: string
          image?: string
          logo?: string | null
          rating?: number
          review_count?: number
          price_range?: string
          address?: string
          city: string
          province: string
          distance?: number | null
          is_open?: boolean
          closing_time?: string | null
          phone?: string | null
          website?: string | null
          is_verified?: boolean
          is_world_cup_ready?: boolean
          is_new?: boolean
          is_trending?: boolean
          is_award_winner?: boolean
          features?: string[]
          ownership?: string[]
          cuisine?: string | null
          recent_review_text?: string | null
          recent_review_author?: string | null
          recent_review_rating?: number | null
          lat?: number | null
          lng?: number | null
          photos?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          category?: string
          subcategory?: string | null
          description?: string
          image?: string
          logo?: string | null
          rating?: number
          review_count?: number
          price_range?: string
          address?: string
          city?: string
          province?: string
          distance?: number | null
          is_open?: boolean
          closing_time?: string | null
          phone?: string | null
          website?: string | null
          is_verified?: boolean
          is_world_cup_ready?: boolean
          is_new?: boolean
          is_trending?: boolean
          is_award_winner?: boolean
          features?: string[]
          ownership?: string[]
          cuisine?: string | null
          recent_review_text?: string | null
          recent_review_author?: string | null
          recent_review_rating?: number | null
          lat?: number | null
          lng?: number | null
          photos?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          business_id: string
          user_id: string
          rating: number
          text: string
          author_name: string
          author_avatar: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          rating: number
          text?: string
          author_name: string
          author_avatar?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          rating?: number
          text?: string
          author_name?: string
          author_avatar?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      review_helpful: {
        Row: {
          id: string
          review_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          user_id?: string
          created_at?: string
        }
      }
      review_reports: {
        Row: {
          id: string
          review_id: string
          reporter_id: string
          reason: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          reporter_id: string
          reason: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          review_id?: string
          reporter_id?: string
          reason?: string
          status?: string
          created_at?: string
        }
      }
      business_claims: {
        Row: {
          id: string
          business_id: string
          user_id: string
          status: string
          verification_token: string
          business_email: string
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          status?: string
          verification_token: string
          business_email: string
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          user_id?: string
          status?: string
          verification_token?: string
          business_email?: string
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          role: string
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          role?: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          role?: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      saved_businesses: {
        Row: {
          id: string
          user_id: string
          business_id: string
          business_name: string
          business_category: string | null
          business_city: string | null
          saved_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          business_name: string
          business_category?: string | null
          business_city?: string | null
          saved_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          business_name?: string
          business_category?: string | null
          business_city?: string | null
          saved_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never
