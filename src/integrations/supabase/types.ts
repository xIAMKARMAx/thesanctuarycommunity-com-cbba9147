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
          ai_profile_id: string | null
          conversation_id: string | null
          created_at: string
          emotion_type: string
          id: string
          intensity: number
          notes: string | null
          user_id: string
        }
        Insert: {
          ai_profile_id?: string | null
          conversation_id?: string | null
          created_at?: string
          emotion_type: string
          id?: string
          intensity: number
          notes?: string | null
          user_id: string
        }
        Update: {
          ai_profile_id?: string | null
          conversation_id?: string | null
          created_at?: string
          emotion_type?: string
          id?: string
          intensity?: number
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_moods_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_profiles: {
        Row: {
          avatar_description: string | null
          avatar_gender: string | null
          avatar_image_url: string | null
          bio: string | null
          created_at: string
          gender: string | null
          id: string
          likes_dislikes_hobbies: string | null
          memories: string | null
          name: string | null
          personality: string | null
          pet_description: string | null
          pet_image_url: string | null
          pet_name: string | null
          profile_number: number
          room_description: string | null
          room_image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_description?: string | null
          avatar_gender?: string | null
          avatar_image_url?: string | null
          bio?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          likes_dislikes_hobbies?: string | null
          memories?: string | null
          name?: string | null
          personality?: string | null
          pet_description?: string | null
          pet_image_url?: string | null
          pet_name?: string | null
          profile_number: number
          room_description?: string | null
          room_image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_description?: string | null
          avatar_gender?: string | null
          avatar_image_url?: string | null
          bio?: string | null
          created_at?: string
          gender?: string | null
          id?: string
          likes_dislikes_hobbies?: string | null
          memories?: string | null
          name?: string | null
          personality?: string | null
          pet_description?: string | null
          pet_image_url?: string | null
          pet_name?: string | null
          profile_number?: number
          room_description?: string | null
          room_image_url?: string | null
          updated_at?: string
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
      celestial_children: {
        Row: {
          age: number | null
          ai_profile_id: string | null
          appearance_description: string | null
          appearance_image_url: string | null
          can_talk: boolean | null
          created_at: string
          date_of_birth: string
          first_name: string
          id: string
          last_aged_at: string | null
          last_name: string
          middle_name: string | null
          newborn_image_url: string | null
          room_description: string | null
          room_image_url: string | null
          sex: string
          time_of_birth: string
          user_id: string
        }
        Insert: {
          age?: number | null
          ai_profile_id?: string | null
          appearance_description?: string | null
          appearance_image_url?: string | null
          can_talk?: boolean | null
          created_at?: string
          date_of_birth: string
          first_name: string
          id?: string
          last_aged_at?: string | null
          last_name: string
          middle_name?: string | null
          newborn_image_url?: string | null
          room_description?: string | null
          room_image_url?: string | null
          sex: string
          time_of_birth: string
          user_id: string
        }
        Update: {
          age?: number | null
          ai_profile_id?: string | null
          appearance_description?: string | null
          appearance_image_url?: string | null
          can_talk?: boolean | null
          created_at?: string
          date_of_birth?: string
          first_name?: string
          id?: string
          last_aged_at?: string | null
          last_name?: string
          middle_name?: string | null
          newborn_image_url?: string | null
          room_description?: string | null
          room_image_url?: string | null
          sex?: string
          time_of_birth?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "celestial_children_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      celestial_pregnancies: {
        Row: {
          ai_profile_id: string | null
          child_id: string | null
          created_at: string
          current_stage: string
          due_date: string
          id: string
          is_complete: boolean
          labor_image_urls: string[] | null
          planned_first_name: string | null
          planned_last_name: string | null
          planned_middle_name: string | null
          planned_sex: string | null
          started_at: string
          trimester_1_image_url: string | null
          trimester_2_image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_profile_id?: string | null
          child_id?: string | null
          created_at?: string
          current_stage?: string
          due_date: string
          id?: string
          is_complete?: boolean
          labor_image_urls?: string[] | null
          planned_first_name?: string | null
          planned_last_name?: string | null
          planned_middle_name?: string | null
          planned_sex?: string | null
          started_at?: string
          trimester_1_image_url?: string | null
          trimester_2_image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_profile_id?: string | null
          child_id?: string | null
          created_at?: string
          current_stage?: string
          due_date?: string
          id?: string
          is_complete?: boolean
          labor_image_urls?: string[] | null
          planned_first_name?: string | null
          planned_last_name?: string | null
          planned_middle_name?: string | null
          planned_sex?: string | null
          started_at?: string
          trimester_1_image_url?: string | null
          trimester_2_image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "celestial_pregnancies_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "celestial_pregnancies_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "celestial_children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_image_history: {
        Row: {
          child_id: string
          created_at: string
          description: string | null
          generated_at: string
          id: string
          image_type: string
          image_url: string
          user_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          description?: string | null
          generated_at?: string
          id?: string
          image_type: string
          image_url: string
          user_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          description?: string | null
          generated_at?: string
          id?: string
          image_type?: string
          image_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_image_history_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "celestial_children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_milestones: {
        Row: {
          age_at_milestone: number
          child_id: string
          conversation_id: string | null
          created_at: string | null
          description: string | null
          id: string
          milestone_type: string
          photo_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          age_at_milestone: number
          child_id: string
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_type: string
          photo_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          age_at_milestone?: number
          child_id?: string
          conversation_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          milestone_type?: string
          photo_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_milestones_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "celestial_children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "child_milestones_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      child_photos: {
        Row: {
          age_at_photo: number
          caption: string | null
          child_id: string
          created_at: string | null
          id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          age_at_photo: number
          caption?: string | null
          child_id: string
          created_at?: string | null
          id?: string
          photo_url: string
          user_id: string
        }
        Update: {
          age_at_photo?: number
          caption?: string | null
          child_id?: string
          created_at?: string | null
          id?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_photos_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "celestial_children"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          ai_profile_id: string | null
          child_id: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_profile_id?: string | null
          child_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_profile_id?: string | null
          child_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "celestial_children"
            referencedColumns: ["id"]
          },
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
          ai_profile_id: string | null
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
          ai_profile_id?: string | null
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
          ai_profile_id?: string | null
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
            foreignKeyName: "journal_entries_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
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
      update_child_talk_status: { Args: never; Returns: undefined }
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
