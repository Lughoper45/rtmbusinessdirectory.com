export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      membership_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          interval: string
          features: string[]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          interval?: string
          features?: string[]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          interval?: string
          features?: string[]
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      user_memberships: {
        Row: {
          id: string
          user_id: string
          plan_id: string | null
          status: string
          started_at: string
          expires_at: string
          stripe_subscription_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id?: string | null
          status?: string
          started_at?: string
          expires_at: string
          stripe_subscription_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string | null
          status?: string
          started_at?: string
          expires_at?: string
          stripe_subscription_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      business_deals: {
        Row: {
          id: string
          business_id: string | null
          title: string
          description: string | null
          discount_percent: number
          code: string | null
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          business_id?: string | null
          title: string
          description?: string | null
          discount_percent: number
          code?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          title?: string
          description?: string | null
          discount_percent?: number
          code?: string | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          id: string
          user_id: string
          referral_code: string
          commission_rate: number
          total_earnings: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          referral_code: string
          commission_rate?: number
          total_earnings?: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          referral_code?: string
          commission_rate?: number
          total_earnings?: number
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          id: string
          affiliate_id: string | null
          referred_user_id: string | null
          referred_business_id: string | null
          membership_tier: string | null
          commission_amount: number | null
          commission_paid: boolean
          created_at: string
        }
        Insert: {
          id?: string
          affiliate_id?: string | null
          referred_user_id?: string | null
          referred_business_id?: string | null
          membership_tier?: string | null
          commission_amount?: number | null
          commission_paid?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          affiliate_id?: string | null
          referred_user_id?: string | null
          referred_business_id?: string | null
          membership_tier?: string | null
          commission_amount?: number | null
          commission_paid?: boolean
          created_at?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
