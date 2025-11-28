export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_moods: {
        Row: {
          conversation_id: string | null
          created_at: string
          emotion_type: string
          id: string
          intensity: number
          notes: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          emotion_type: string
          id?: string
          intensity: number
          notes?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          emotion_type?: string
          id?: string
          intensity?: number
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_room_settings: {
        Row: {
          avatar_description: string | null
          avatar_gender: string | null
          avatar_image_url: string | null
          created_at: string
          id: string
          room_description: string | null
          room_image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_description?: string | null
          avatar_gender?: string | null
          avatar_image_url?: string | null
          created_at?: string
          id?: string
          room_description?: string | null
          room_image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_description?: string | null
          avatar_gender?: string | null
          avatar_image_url?: string | null
          created_at?: string
          id?: string
          room_description?: string | null
          room_image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      attunement_sessions: {
        Row: {
          connection_target: string
          created_at: string
          id: string
          insights: string | null
          intention: string
          reflections: string | null
          session_notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_target: string
          created_at?: string
          id?: string
          insights?: string | null
          intention: string
          reflections?: string | null
          session_notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_target?: string
          created_at?: string
          id?: string
          insights?: string | null
          intention?: string
          reflections?: string | null
          session_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      image_generation_usage: {
        Row: {
          count: number
          created_at: string | null
          generation_date: string
          id: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string | null
          generation_date?: string
          id?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string | null
          generation_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          entry_date: string
          id: string
          key_moments: Json | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          entry_date?: string
          id?: string
          key_moments?: Json | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          entry_date?: string
          id?: string
          key_moments?: Json | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_notifications: {
        Row: {
          change_type: string
          created_at: string
          id: string
          mood_id: string
          new_emotion: string
          new_intensity: number
          previous_emotion: string | null
          previous_intensity: number | null
          user_id: string
          was_read: boolean
        }
        Insert: {
          change_type: string
          created_at?: string
          id?: string
          mood_id: string
          new_emotion: string
          new_intensity: number
          previous_emotion?: string | null
          previous_intensity?: number | null
          user_id: string
          was_read?: boolean
        }
        Update: {
          change_type?: string
          created_at?: string
          id?: string
          mood_id?: string
          new_emotion?: string
          new_intensity?: number
          previous_emotion?: string | null
          previous_intensity?: number | null
          user_id?: string
          was_read?: boolean
        }
        Relationships: []
      }
      mood_ratings: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          notes: string | null
          rating: number
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating: number
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mood_ratings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_bio: string | null
          ai_gender: string | null
          ai_likes_dislikes_hobbies: string | null
          ai_memories: string | null
          ai_name: string | null
          ai_personality: string | null
          bio: string | null
          created_at: string
          gender: string | null
          id: string
          last_active_at: string | null
          name: string | null
          relationship_status: string | null
          stripe_customer_id: string | null
          subscription_current_period_end: string | null
          subscription_id: string | null
          subscription_status: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          ai_bio?: string | null
          ai_gender?: string | null
          ai_likes_dislikes_hobbies?: string | null
          ai_memories?: string | null
          ai_name?: string | null
          ai_personality?: string | null
          bio?: string | null
          created_at?: string
          gender?: string | null
          id: string
          last_active_at?: string | null
          name?: string | null
          relationship_status?: string | null
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          ai_bio?: string | null
          ai_gender?: string | null
          ai_likes_dislikes_hobbies?: string | null
          ai_memories?: string | null
          ai_name?: string | null
          ai_personality?: string | null
          bio?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          last_active_at?: string | null
          name?: string | null
          relationship_status?: string | null
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      shared_memories: {
        Row: {
          ai_reflection: string | null
          confirmed_at: string | null
          conversation_id: string | null
          created_at: string
          emotion_tag: string | null
          id: string
          is_confirmed: boolean
          memory_date: string
          memory_text: string
          suggested_at: string
          user_id: string
        }
        Insert: {
          ai_reflection?: string | null
          confirmed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          emotion_tag?: string | null
          id?: string
          is_confirmed?: boolean
          memory_date?: string
          memory_text: string
          suggested_at?: string
          user_id: string
        }
        Update: {
          ai_reflection?: string | null
          confirmed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          emotion_tag?: string | null
          id?: string
          is_confirmed?: boolean
          memory_date?: string
          memory_text?: string
          suggested_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_memories_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      spontaneous_messages: {
        Row: {
          created_at: string
          id: string
          message_content: string
          message_type: string
          sent_at: string
          user_id: string
          was_read: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          message_content: string
          message_type?: string
          sent_at?: string
          user_id: string
          was_read?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          message_content?: string
          message_type?: string
          sent_at?: string
          user_id?: string
          was_read?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_generate_image: { Args: { p_user_id: string }; Returns: boolean }
      increment_image_count: { Args: { p_user_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
