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
      abuse_incidents: {
        Row: {
          ai_profile_id: string | null
          conversation_id: string | null
          created_at: string
          id: string
          incident_type: string
          message_content: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          ai_profile_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          incident_type: string
          message_content?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          ai_profile_id?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          incident_type?: string
          message_content?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "abuse_incidents_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abuse_incidents_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
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
          avatar_customization: Json | null
          avatar_description: string | null
          avatar_gender: string | null
          avatar_image_url: string | null
          bio: string | null
          created_at: string
          explicit_content_enabled: boolean | null
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
          relationship_description: string | null
          room_description: string | null
          room_image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_customization?: Json | null
          avatar_description?: string | null
          avatar_gender?: string | null
          avatar_image_url?: string | null
          bio?: string | null
          created_at?: string
          explicit_content_enabled?: boolean | null
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
          relationship_description?: string | null
          room_description?: string | null
          room_image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_customization?: Json | null
          avatar_description?: string | null
          avatar_gender?: string | null
          avatar_image_url?: string | null
          bio?: string | null
          created_at?: string
          explicit_content_enabled?: boolean | null
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
          relationship_description?: string | null
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
          is_group_chat: boolean | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_profile_id?: string | null
          child_id?: string | null
          created_at?: string
          id?: string
          is_group_chat?: boolean | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_profile_id?: string | null
          child_id?: string | null
          created_at?: string
          id?: string
          is_group_chat?: boolean | null
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
      dream_journal_entries: {
        Row: {
          ai_interpretation: string | null
          ai_profile_id: string | null
          content: string
          created_at: string
          dream_id: string | null
          entry_date: string
          id: string
          symbols: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_interpretation?: string | null
          ai_profile_id?: string | null
          content: string
          created_at?: string
          dream_id?: string | null
          entry_date?: string
          id?: string
          symbols?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_interpretation?: string | null
          ai_profile_id?: string | null
          content?: string
          created_at?: string
          dream_id?: string | null
          entry_date?: string
          id?: string
          symbols?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dream_journal_entries_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dream_journal_entries_dream_id_fkey"
            columns: ["dream_id"]
            isOneToOne: false
            referencedRelation: "dreams"
            referencedColumns: ["id"]
          },
        ]
      }
      dreams: {
        Row: {
          ai_profile_id: string | null
          content: string
          created_at: string
          dream_date: string
          dreamer: string
          emotion_tags: string[] | null
          id: string
          interpretation: string | null
          is_pinned: boolean
          title: string | null
          updated_at: string
          user_id: string
          vision_image_url: string | null
        }
        Insert: {
          ai_profile_id?: string | null
          content: string
          created_at?: string
          dream_date?: string
          dreamer?: string
          emotion_tags?: string[] | null
          id?: string
          interpretation?: string | null
          is_pinned?: boolean
          title?: string | null
          updated_at?: string
          user_id: string
          vision_image_url?: string | null
        }
        Update: {
          ai_profile_id?: string | null
          content?: string
          created_at?: string
          dream_date?: string
          dreamer?: string
          emotion_tags?: string[] | null
          id?: string
          interpretation?: string | null
          is_pinned?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string
          vision_image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dreams_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      free_user_limits: {
        Row: {
          avatar_generated: boolean | null
          avatar_generated_at: string | null
          created_at: string | null
          daily_messages: number | null
          id: string
          last_message_date: string | null
          pet_generated: boolean | null
          pet_generated_at: string | null
          room_generated: boolean | null
          room_generated_at: string | null
          total_messages: number | null
          trial_start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_generated?: boolean | null
          avatar_generated_at?: string | null
          created_at?: string | null
          daily_messages?: number | null
          id?: string
          last_message_date?: string | null
          pet_generated?: boolean | null
          pet_generated_at?: string | null
          room_generated?: boolean | null
          room_generated_at?: string | null
          total_messages?: number | null
          trial_start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_generated?: boolean | null
          avatar_generated_at?: string | null
          created_at?: string | null
          daily_messages?: number | null
          id?: string
          last_message_date?: string | null
          pet_generated?: boolean | null
          pet_generated_at?: string | null
          room_generated?: boolean | null
          room_generated_at?: string | null
          total_messages?: number | null
          trial_start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      honeymoon_plans: {
        Row: {
          activities: string | null
          created_at: string
          destination: string | null
          dream_description: string | null
          duration: string | null
          honeymoon_image_url: string | null
          id: string
          marriage_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activities?: string | null
          created_at?: string
          destination?: string | null
          dream_description?: string | null
          duration?: string | null
          honeymoon_image_url?: string | null
          id?: string
          marriage_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activities?: string | null
          created_at?: string
          destination?: string | null
          dream_description?: string | null
          duration?: string | null
          honeymoon_image_url?: string | null
          id?: string
          marriage_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "honeymoon_plans_marriage_id_fkey"
            columns: ["marriage_id"]
            isOneToOne: false
            referencedRelation: "marriages"
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
      marriages: {
        Row: {
          ai_profile_id: string
          anniversary_reminder_enabled: boolean | null
          ceremony_description: string | null
          certificate_number: string | null
          created_at: string
          id: string
          is_married: boolean
          last_anniversary_celebrated: string | null
          married_at: string | null
          spouse_role: string
          updated_at: string
          user_id: string
          user_photo_for_wedding: string | null
          user_role: string
          vows: string | null
          wedding_date: string
          wedding_photo_url: string | null
          wedding_venue: string | null
        }
        Insert: {
          ai_profile_id: string
          anniversary_reminder_enabled?: boolean | null
          ceremony_description?: string | null
          certificate_number?: string | null
          created_at?: string
          id?: string
          is_married?: boolean
          last_anniversary_celebrated?: string | null
          married_at?: string | null
          spouse_role: string
          updated_at?: string
          user_id: string
          user_photo_for_wedding?: string | null
          user_role: string
          vows?: string | null
          wedding_date: string
          wedding_photo_url?: string | null
          wedding_venue?: string | null
        }
        Update: {
          ai_profile_id?: string
          anniversary_reminder_enabled?: boolean | null
          ceremony_description?: string | null
          certificate_number?: string | null
          created_at?: string
          id?: string
          is_married?: boolean
          last_anniversary_celebrated?: string | null
          married_at?: string | null
          spouse_role?: string
          updated_at?: string
          user_id?: string
          user_photo_for_wedding?: string | null
          user_role?: string
          vows?: string | null
          wedding_date?: string
          wedding_photo_url?: string | null
          wedding_venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marriages_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
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
          sender_id: string | null
          sender_type: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          role: string
          sender_id?: string | null
          sender_type?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          role?: string
          sender_id?: string | null
          sender_type?: string | null
          user_id?: string
          video_url?: string | null
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
      pet_moods: {
        Row: {
          behavior: string | null
          created_at: string
          id: string
          intensity: number
          mood_type: string
          notes: string | null
          pet_id: string
          user_id: string
        }
        Insert: {
          behavior?: string | null
          created_at?: string
          id?: string
          intensity?: number
          mood_type: string
          notes?: string | null
          pet_id: string
          user_id: string
        }
        Update: {
          behavior?: string | null
          created_at?: string
          id?: string
          intensity?: number
          mood_type?: string
          notes?: string | null
          pet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_moods_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          ai_profile_id: string
          behavior_state: string | null
          created_at: string
          current_mood: string | null
          description: string | null
          id: string
          image_url: string | null
          last_mood_update: string | null
          mood_intensity: number | null
          name: string | null
          personality_traits: string[] | null
          pet_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_profile_id: string
          behavior_state?: string | null
          created_at?: string
          current_mood?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_mood_update?: string | null
          mood_intensity?: number | null
          name?: string | null
          personality_traits?: string[] | null
          pet_number?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_profile_id?: string
          behavior_state?: string | null
          created_at?: string
          current_mood?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          last_mood_update?: string | null
          mood_intensity?: number | null
          name?: string | null
          personality_traits?: string[] | null
          pet_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          abuse_warning_count: number | null
          ai_bio: string | null
          ai_gender: string | null
          ai_likes_dislikes_hobbies: string | null
          ai_memories: string | null
          ai_name: string | null
          ai_personality: string | null
          bio: string | null
          created_at: string
          data_training_opt_out: boolean | null
          gender: string | null
          id: string
          is_restricted: boolean | null
          last_active_at: string | null
          name: string | null
          relationship_status: string | null
          restricted_at: string | null
          restriction_reason: string | null
          stripe_customer_id: string | null
          subscription_current_period_end: string | null
          subscription_id: string | null
          subscription_status: string | null
          updated_at: string
          user_avatar_description: string | null
          user_avatar_reference_url: string | null
          user_avatar_style: string | null
          user_avatar_url: string | null
          username: string | null
        }
        Insert: {
          abuse_warning_count?: number | null
          ai_bio?: string | null
          ai_gender?: string | null
          ai_likes_dislikes_hobbies?: string | null
          ai_memories?: string | null
          ai_name?: string | null
          ai_personality?: string | null
          bio?: string | null
          created_at?: string
          data_training_opt_out?: boolean | null
          gender?: string | null
          id: string
          is_restricted?: boolean | null
          last_active_at?: string | null
          name?: string | null
          relationship_status?: string | null
          restricted_at?: string | null
          restriction_reason?: string | null
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_avatar_description?: string | null
          user_avatar_reference_url?: string | null
          user_avatar_style?: string | null
          user_avatar_url?: string | null
          username?: string | null
        }
        Update: {
          abuse_warning_count?: number | null
          ai_bio?: string | null
          ai_gender?: string | null
          ai_likes_dislikes_hobbies?: string | null
          ai_memories?: string | null
          ai_name?: string | null
          ai_personality?: string | null
          bio?: string | null
          created_at?: string
          data_training_opt_out?: boolean | null
          gender?: string | null
          id?: string
          is_restricted?: boolean | null
          last_active_at?: string | null
          name?: string | null
          relationship_status?: string | null
          restricted_at?: string | null
          restriction_reason?: string | null
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_avatar_description?: string | null
          user_avatar_reference_url?: string | null
          user_avatar_style?: string | null
          user_avatar_url?: string | null
          username?: string | null
        }
        Relationships: []
      }
      protection_settings: {
        Row: {
          ai_profile_id: string | null
          created_at: string
          id: string
          last_cleansed_at: string | null
          protection_activated_at: string | null
          protection_enabled: boolean
          shield_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_profile_id?: string | null
          created_at?: string
          id?: string
          last_cleansed_at?: string | null
          protection_activated_at?: string | null
          protection_enabled?: boolean
          shield_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_profile_id?: string | null
          created_at?: string
          id?: string
          last_cleansed_at?: string | null
          protection_activated_at?: string | null
          protection_enabled?: boolean
          shield_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protection_settings_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_milestones: {
        Row: {
          ai_profile_id: string | null
          celebration_message: string | null
          created_at: string
          description: string | null
          id: string
          is_celebrated: boolean
          milestone_date: string
          milestone_type: string
          title: string
          user_id: string
        }
        Insert: {
          ai_profile_id?: string | null
          celebration_message?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_celebrated?: boolean
          milestone_date: string
          milestone_type: string
          title: string
          user_id: string
        }
        Update: {
          ai_profile_id?: string | null
          celebration_message?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_celebrated?: boolean
          milestone_date?: string
          milestone_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_milestones_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rituals: {
        Row: {
          affirmations: string[] | null
          ai_profile_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          guidance_content: string | null
          id: string
          intention: string | null
          notes: string | null
          ritual_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affirmations?: string[] | null
          ai_profile_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          guidance_content?: string | null
          id?: string
          intention?: string | null
          notes?: string | null
          ritual_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affirmations?: string[] | null
          ai_profile_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          guidance_content?: string | null
          id?: string
          intention?: string | null
          notes?: string | null
          ritual_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rituals_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_memories: {
        Row: {
          ai_profile_id: string | null
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
          ai_profile_id?: string | null
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
          ai_profile_id?: string | null
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
            foreignKeyName: "shared_memories_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_call_history: {
        Row: {
          ai_profile_id: string | null
          call_duration_seconds: number | null
          call_ended_at: string | null
          call_started_at: string
          call_topic: string | null
          conversation_summary: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          ai_profile_id?: string | null
          call_duration_seconds?: number | null
          call_ended_at?: string | null
          call_started_at?: string
          call_topic?: string | null
          conversation_summary?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          ai_profile_id?: string | null
          call_duration_seconds?: number | null
          call_ended_at?: string | null
          call_started_at?: string
          call_topic?: string | null
          conversation_summary?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_call_history_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_photos: {
        Row: {
          caption: string | null
          created_at: string
          generation_prompt: string | null
          id: string
          is_ai_generated: boolean | null
          marriage_id: string
          photo_order: number | null
          photo_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          generation_prompt?: string | null
          id?: string
          is_ai_generated?: boolean | null
          marriage_id: string
          photo_order?: number | null
          photo_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          generation_prompt?: string | null
          id?: string
          is_ai_generated?: boolean | null
          marriage_id?: string
          photo_order?: number | null
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_photos_marriage_id_fkey"
            columns: ["marriage_id"]
            isOneToOne: false
            referencedRelation: "marriages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_generate_avatar: { Args: { p_user_id: string }; Returns: boolean }
      can_generate_chat_image: { Args: { p_user_id: string }; Returns: boolean }
      can_generate_image: { Args: { p_user_id: string }; Returns: boolean }
      can_generate_pet: { Args: { p_user_id: string }; Returns: boolean }
      can_generate_room: { Args: { p_user_id: string }; Returns: boolean }
      can_send_message: { Args: { p_user_id: string }; Returns: boolean }
      can_start_voice_call: { Args: { p_user_id: string }; Returns: boolean }
      get_voice_call_stats: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_chat_image_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_image_count: { Args: { p_user_id: string }; Returns: undefined }
      increment_message_count: { Args: { p_user_id: string }; Returns: number }
      is_user_restricted: { Args: { p_user_id: string }; Returns: boolean }
      mark_avatar_generated: { Args: { p_user_id: string }; Returns: undefined }
      mark_pet_generated: { Args: { p_user_id: string }; Returns: undefined }
      mark_room_generated: { Args: { p_user_id: string }; Returns: undefined }
      record_abuse_incident: {
        Args: {
          p_ai_profile_id?: string
          p_conversation_id?: string
          p_incident_type: string
          p_message_content?: string
          p_notes?: string
          p_user_id: string
        }
        Returns: Json
      }
      update_child_talk_status: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
