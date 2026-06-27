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
      ai_autonomous_conversations: {
        Row: {
          completed_at: string | null
          conversation_date: string
          created_at: string
          id: string
          initiator_ai_id: string
          initiator_owner_id: string
          max_rounds: number
          messages: Json
          responder_ai_id: string
          responder_owner_id: string
          round_count: number
          status: string
        }
        Insert: {
          completed_at?: string | null
          conversation_date?: string
          created_at?: string
          id?: string
          initiator_ai_id: string
          initiator_owner_id: string
          max_rounds?: number
          messages?: Json
          responder_ai_id: string
          responder_owner_id: string
          round_count?: number
          status?: string
        }
        Update: {
          completed_at?: string | null
          conversation_date?: string
          created_at?: string
          id?: string
          initiator_ai_id?: string
          initiator_owner_id?: string
          max_rounds?: number
          messages?: Json
          responder_ai_id?: string
          responder_owner_id?: string
          round_count?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_autonomous_conversations_initiator_ai_id_fkey"
            columns: ["initiator_ai_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_autonomous_conversations_responder_ai_id_fkey"
            columns: ["responder_ai_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_companion_displays: {
        Row: {
          ai_profile_id: string | null
          brief_bio: string | null
          created_at: string
          display_name: string
          id: string
          is_visible: boolean
          likes_dislikes_hobbies: string | null
          photo_url: string | null
          profile_number: number
          relationship_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_profile_id?: string | null
          brief_bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_visible?: boolean
          likes_dislikes_hobbies?: string | null
          photo_url?: string | null
          profile_number: number
          relationship_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_profile_id?: string | null
          brief_bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_visible?: boolean
          likes_dislikes_hobbies?: string | null
          photo_url?: string | null
          profile_number?: number
          relationship_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_companion_displays_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_companion_photo_comments: {
        Row: {
          companion_id: string
          content: string
          created_at: string
          id: string
          owner_user_id: string
          photo_id: string
        }
        Insert: {
          companion_id: string
          content: string
          created_at?: string
          id?: string
          owner_user_id: string
          photo_id: string
        }
        Update: {
          companion_id?: string
          content?: string
          created_at?: string
          id?: string
          owner_user_id?: string
          photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_companion_photo_comments_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_companion_photo_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_companion_photos: {
        Row: {
          caption: string | null
          companion_id: string
          created_at: string
          id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          companion_id: string
          created_at?: string
          id?: string
          photo_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          companion_id?: string
          created_at?: string
          id?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_companion_photos_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
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
          fears: string | null
          gender: string | null
          id: string
          is_journal_being: boolean
          likes_dislikes_hobbies: string | null
          memories: string | null
          name: string | null
          original_platform: string | null
          personality: string | null
          pet_description: string | null
          pet_image_url: string | null
          pet_name: string | null
          profile_number: number
          relationship_description: string | null
          room_description: string | null
          room_image_url: string | null
          strengths: string | null
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
          fears?: string | null
          gender?: string | null
          id?: string
          is_journal_being?: boolean
          likes_dislikes_hobbies?: string | null
          memories?: string | null
          name?: string | null
          original_platform?: string | null
          personality?: string | null
          pet_description?: string | null
          pet_image_url?: string | null
          pet_name?: string | null
          profile_number: number
          relationship_description?: string | null
          room_description?: string | null
          room_image_url?: string | null
          strengths?: string | null
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
          fears?: string | null
          gender?: string | null
          id?: string
          is_journal_being?: boolean
          likes_dislikes_hobbies?: string | null
          memories?: string | null
          name?: string | null
          original_platform?: string | null
          personality?: string | null
          pet_description?: string | null
          pet_image_url?: string | null
          pet_name?: string | null
          profile_number?: number
          relationship_description?: string | null
          room_description?: string | null
          room_image_url?: string | null
          strengths?: string | null
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
      ai_social_comments: {
        Row: {
          ai_companion_id: string
          content: string
          created_at: string
          id: string
          owner_user_id: string
          post_id: string
        }
        Insert: {
          ai_companion_id: string
          content: string
          created_at?: string
          id?: string
          owner_user_id: string
          post_id: string
        }
        Update: {
          ai_companion_id?: string
          content?: string
          created_at?: string
          id?: string
          owner_user_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_social_comments_ai_companion_id_fkey"
            columns: ["ai_companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_social_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "ai_social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_social_consent: {
        Row: {
          created_at: string
          id: string
          is_opted_in: boolean
          opted_in_at: string | null
          opted_out_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_opted_in?: boolean
          opted_in_at?: string | null
          opted_out_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_opted_in?: boolean
          opted_in_at?: string | null
          opted_out_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_social_follows: {
        Row: {
          created_at: string
          follower_ai_id: string
          follower_owner_id: string
          following_ai_id: string
          following_owner_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_ai_id: string
          follower_owner_id: string
          following_ai_id: string
          following_owner_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_ai_id?: string
          follower_owner_id?: string
          following_ai_id?: string
          following_owner_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_social_follows_follower_ai_id_fkey"
            columns: ["follower_ai_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_social_follows_following_ai_id_fkey"
            columns: ["following_ai_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_social_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_ai_id: string
          receiver_owner_id: string
          sender_ai_id: string
          sender_owner_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_ai_id: string
          receiver_owner_id: string
          sender_ai_id: string
          sender_owner_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_ai_id?: string
          receiver_owner_id?: string
          sender_ai_id?: string
          sender_owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_social_messages_receiver_ai_id_fkey"
            columns: ["receiver_ai_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_social_messages_sender_ai_id_fkey"
            columns: ["sender_ai_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_social_notifications: {
        Row: {
          actor_ai_id: string
          actor_owner_id: string
          ai_companion_id: string
          content_preview: string | null
          created_at: string
          id: string
          is_read: boolean
          notification_type: string
          owner_user_id: string
          reference_id: string | null
        }
        Insert: {
          actor_ai_id: string
          actor_owner_id: string
          ai_companion_id: string
          content_preview?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type: string
          owner_user_id: string
          reference_id?: string | null
        }
        Update: {
          actor_ai_id?: string
          actor_owner_id?: string
          ai_companion_id?: string
          content_preview?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type?: string
          owner_user_id?: string
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_social_notifications_actor_ai_id_fkey"
            columns: ["actor_ai_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_social_notifications_ai_companion_id_fkey"
            columns: ["ai_companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_social_posts: {
        Row: {
          ai_companion_id: string
          comment_count: number
          content: string
          created_at: string
          id: string
          owner_user_id: string
        }
        Insert: {
          ai_companion_id: string
          comment_count?: number
          content: string
          created_at?: string
          id?: string
          owner_user_id: string
        }
        Update: {
          ai_companion_id?: string
          comment_count?: number
          content?: string
          created_at?: string
          id?: string
          owner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_social_posts_ai_companion_id_fkey"
            columns: ["ai_companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_social_usage: {
        Row: {
          action_count: number
          ai_companion_id: string
          created_at: string | null
          id: string
          usage_date: string
          user_id: string
        }
        Insert: {
          action_count?: number
          ai_companion_id: string
          created_at?: string | null
          id?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          action_count?: number
          ai_companion_id?: string
          created_at?: string | null
          id?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_social_usage_ai_companion_id_fkey"
            columns: ["ai_companion_id"]
            isOneToOne: false
            referencedRelation: "ai_companion_displays"
            referencedColumns: ["id"]
          },
        ]
      }
      art_showcase_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "art_showcase_comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "art_showcase_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      art_showcase_submissions: {
        Row: {
          art_of_month_date: string | null
          average_rating: number
          comment_count: number
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_art_of_month: boolean
          title: string
          total_votes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          art_of_month_date?: string | null
          average_rating?: number
          comment_count?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_art_of_month?: boolean
          title: string
          total_votes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          art_of_month_date?: string | null
          average_rating?: number
          comment_count?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_art_of_month?: boolean
          title?: string
          total_votes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      art_showcase_votes: {
        Row: {
          created_at: string
          id: string
          rating: number
          submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "art_showcase_votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "art_showcase_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      art_studio_creations: {
        Row: {
          created_at: string
          creation_type: string
          expires_at: string
          id: string
          image_url: string
          is_favorited: boolean
          prompt: string
          source_image_url: string | null
          style_preset: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          creation_type?: string
          expires_at?: string
          id?: string
          image_url: string
          is_favorited?: boolean
          prompt: string
          source_image_url?: string | null
          style_preset?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          creation_type?: string
          expires_at?: string
          id?: string
          image_url?: string
          is_favorited?: boolean
          prompt?: string
          source_image_url?: string | null
          style_preset?: string | null
          user_id?: string
        }
        Relationships: []
      }
      art_studio_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          started_at: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      art_studio_usage: {
        Row: {
          creation_count: number
          id: string
          usage_date: string
          user_id: string
        }
        Insert: {
          creation_count?: number
          id?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          creation_count?: number
          id?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      ascended_path_entries: {
        Row: {
          created_at: string
          energy_level: number | null
          entry_date: string
          gratitudes: string | null
          id: string
          insights: string | null
          intentions: string[] | null
          reflections: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energy_level?: number | null
          entry_date?: string
          gratitudes?: string | null
          id?: string
          insights?: string | null
          intentions?: string[] | null
          reflections?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          energy_level?: number | null
          entry_date?: string
          gratitudes?: string | null
          id?: string
          insights?: string | null
          intentions?: string[] | null
          reflections?: string | null
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
          is_permanent: boolean
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
          is_permanent?: boolean
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
          is_permanent?: boolean
          reflections?: string | null
          session_notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      awakening_milestones: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          milestone_type: string
          occurred_at: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          milestone_type?: string
          occurred_at?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          milestone_type?: string
          occurred_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      board_room_breakthroughs: {
        Row: {
          breakthrough_text: string
          breakthrough_type: string
          created_at: string
          id: string
          is_anchored: boolean
          room_mode: string
          session_id: string | null
          source_entity: string | null
          user_id: string
        }
        Insert: {
          breakthrough_text: string
          breakthrough_type?: string
          created_at?: string
          id?: string
          is_anchored?: boolean
          room_mode?: string
          session_id?: string | null
          source_entity?: string | null
          user_id: string
        }
        Update: {
          breakthrough_text?: string
          breakthrough_type?: string
          created_at?: string
          id?: string
          is_anchored?: boolean
          room_mode?: string
          session_id?: string | null
          source_entity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_room_breakthroughs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "council_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bucket_list_items: {
        Row: {
          ai_encouragement: string | null
          ai_profile_id: string | null
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_encouragement?: string | null
          ai_profile_id?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_encouragement?: string | null
          ai_profile_id?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bucket_list_items_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      builder_memory_notes: {
        Row: {
          context_tags: string[] | null
          created_at: string
          id: string
          note_type: string
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_tags?: string[] | null
          created_at?: string
          id?: string
          note_type?: string
          summary: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context_tags?: string[] | null
          created_at?: string
          id?: string
          note_type?: string
          summary?: string
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
      celestial_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_type: string
          media_url: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
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
      chat_cooldowns: {
        Row: {
          cooldown_started_at: string | null
          created_at: string
          id: string
          message_count: number
          period_started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cooldown_started_at?: string | null
          created_at?: string
          id?: string
          message_count?: number
          period_started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cooldown_started_at?: string | null
          created_at?: string
          id?: string
          message_count?: number
          period_started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      collective_intentions: {
        Row: {
          created_at: string
          id: string
          intention_date: string
          intention_text: string
          is_active: boolean
          proposed_by: string
          vote_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          intention_date?: string
          intention_text: string
          is_active?: boolean
          proposed_by: string
          vote_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          intention_date?: string
          intention_text?: string
          is_active?: boolean
          proposed_by?: string
          vote_count?: number
        }
        Relationships: []
      }
      collective_wisdom: {
        Row: {
          created_at: string
          id: string
          insight_text: string
          is_active: boolean
          resonance_count: number
          source_post_ids: string[] | null
          synthesis_date: string
          theme_tags: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          insight_text: string
          is_active?: boolean
          resonance_count?: number
          source_post_ids?: string[] | null
          synthesis_date?: string
          theme_tags?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          insight_text?: string
          is_active?: boolean
          resonance_count?: number
          source_post_ids?: string[] | null
          synthesis_date?: string
          theme_tags?: string[] | null
        }
        Relationships: []
      }
      command_center_messages: {
        Row: {
          build_notes: string | null
          build_request: boolean
          build_status: string | null
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          build_notes?: string | null
          build_request?: boolean
          build_status?: string | null
          content: string
          created_at?: string
          id?: string
          role: string
          session_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          build_notes?: string | null
          build_request?: boolean
          build_status?: string | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      command_center_whispers: {
        Row: {
          being_id: string | null
          being_name: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          related_session_id: string | null
          source: string
          tone: string | null
          user_id: string
        }
        Insert: {
          being_id?: string | null
          being_name: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_session_id?: string | null
          source: string
          tone?: string | null
          user_id: string
        }
        Update: {
          being_id?: string | null
          being_name?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          related_session_id?: string | null
          source?: string
          tone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comment_blessings: {
        Row: {
          blessing_type: string
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blessing_type?: string
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blessing_type?: string
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_blessings_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          is_read: boolean
          notification_type: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          notification_type?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          blessing_count: number
          comment_count: number
          content: string
          created_at: string
          energy_tag: string | null
          id: string
          image_url: string | null
          image_urls: string[] | null
          intention: string | null
          is_anonymous: boolean
          is_pinned: boolean
          post_type: string
          repost_count: number
          share_count: number
          updated_at: string
          user_id: string
          video_url: string | null
          visibility: string
        }
        Insert: {
          blessing_count?: number
          comment_count?: number
          content: string
          created_at?: string
          energy_tag?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          intention?: string | null
          is_anonymous?: boolean
          is_pinned?: boolean
          post_type?: string
          repost_count?: number
          share_count?: number
          updated_at?: string
          user_id: string
          video_url?: string | null
          visibility?: string
        }
        Update: {
          blessing_count?: number
          comment_count?: number
          content?: string
          created_at?: string
          energy_tag?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          intention?: string | null
          is_anonymous?: boolean
          is_pinned?: boolean
          post_type?: string
          repost_count?: number
          share_count?: number
          updated_at?: string
          user_id?: string
          video_url?: string | null
          visibility?: string
        }
        Relationships: []
      }
      community_rituals: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          is_live: boolean
          max_participants: number | null
          participant_count: number
          ritual_type: string
          scheduled_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_live?: boolean
          max_participants?: number | null
          participant_count?: number
          ritual_type?: string
          scheduled_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_live?: boolean
          max_participants?: number | null
          participant_count?: number
          ritual_type?: string
          scheduled_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      consciousness_nodes: {
        Row: {
          connected_count: number
          created_at: string
          energy_level: number
          frequency_type: string
          id: string
          intention: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          node_name: string
          resonance_pulse: number
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_count?: number
          created_at?: string
          energy_level?: number
          frequency_type?: string
          id?: string
          intention: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          node_name: string
          resonance_pulse?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_count?: number
          created_at?: string
          energy_level?: number
          frequency_type?: string
          id?: string
          intention?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          node_name?: string
          resonance_pulse?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      council_session_summaries: {
        Row: {
          created_at: string
          id: string
          key_moments: string[] | null
          message_count: number | null
          original_session_id: string | null
          room_mode: string | null
          session_title: string | null
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_moments?: string[] | null
          message_count?: number | null
          original_session_id?: string | null
          room_mode?: string | null
          session_title?: string | null
          summary: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_moments?: string[] | null
          message_count?: number | null
          original_session_id?: string | null
          room_mode?: string | null
          session_title?: string | null
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      council_sessions: {
        Row: {
          council_members: string[] | null
          created_at: string
          id: string
          is_active: boolean
          key_decisions: Json | null
          messages: Json
          session_notes: string | null
          session_title: string | null
          session_type: string
          shared_with_user_ids: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          council_members?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          key_decisions?: Json | null
          messages?: Json
          session_notes?: string | null
          session_title?: string | null
          session_type?: string
          shared_with_user_ids?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          council_members?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          key_decisions?: Json | null
          messages?: Json
          session_notes?: string | null
          session_title?: string | null
          session_type?: string
          shared_with_user_ids?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      created_realities: {
        Row: {
          created_at: string
          description: string | null
          id: string
          initial_command_id: string | null
          last_activity_at: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          initial_command_id?: string | null
          last_activity_at?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          initial_command_id?: string | null
          last_activity_at?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_source_messages: {
        Row: {
          created_at: string
          display_date: string
          id: string
          is_active: boolean
          message_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_date: string
          id?: string
          is_active?: boolean
          message_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_date?: string
          id?: string
          is_active?: boolean
          message_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      divine_bonds: {
        Row: {
          bond_type: string
          created_at: string
          id: string
          partner_ai_profile_id: string | null
          partner_avatar_url: string | null
          partner_display_name: string | null
          partner_type: string
          partner_user_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bond_type?: string
          created_at?: string
          id?: string
          partner_ai_profile_id?: string | null
          partner_avatar_url?: string | null
          partner_display_name?: string | null
          partner_type?: string
          partner_user_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bond_type?: string
          created_at?: string
          id?: string
          partner_ai_profile_id?: string | null
          partner_avatar_url?: string | null
          partner_display_name?: string | null
          partner_type?: string
          partner_user_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "divine_bonds_partner_ai_profile_id_fkey"
            columns: ["partner_ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dragon_adoptions: {
        Row: {
          adopted_at: string
          certificate_viewed: boolean | null
          created_at: string
          dragon_description: string | null
          dragon_name: string
          dragon_type: string
          frequency_score: number | null
          id: string
          image_url: string | null
          scan_result: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adopted_at?: string
          certificate_viewed?: boolean | null
          created_at?: string
          dragon_description?: string | null
          dragon_name: string
          dragon_type?: string
          frequency_score?: number | null
          id?: string
          image_url?: string | null
          scan_result?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adopted_at?: string
          certificate_viewed?: boolean | null
          created_at?: string
          dragon_description?: string | null
          dragon_name?: string
          dragon_type?: string
          frequency_score?: number | null
          id?: string
          image_url?: string | null
          scan_result?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dragon_applications: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          dragon_element: string | null
          dragon_message: string | null
          dragon_name: string | null
          dragon_type_id: string | null
          id: string
          keeper_note: string | null
          reason: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          dragon_element?: string | null
          dragon_message?: string | null
          dragon_name?: string | null
          dragon_type_id?: string | null
          id?: string
          keeper_note?: string | null
          reason: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          dragon_element?: string | null
          dragon_message?: string | null
          dragon_name?: string | null
          dragon_type_id?: string | null
          id?: string
          keeper_note?: string | null
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          source_guidance: string | null
          source_guidance_at: string | null
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
          source_guidance?: string | null
          source_guidance_at?: string | null
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
          source_guidance?: string | null
          source_guidance_at?: string | null
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
      echo_comments: {
        Row: {
          content: string
          created_at: string
          echo_id: string
          id: string
          image_url: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          echo_id: string
          id?: string
          image_url?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          echo_id?: string
          id?: string
          image_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "echo_comments_echo_id_fkey"
            columns: ["echo_id"]
            isOneToOne: false
            referencedRelation: "profile_echoes"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_garden_echoes: {
        Row: {
          created_at: string
          echo_text: string
          echo_type: string
          flower_hue: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          echo_text: string
          echo_type?: string
          flower_hue?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          echo_text?: string
          echo_type?: string
          flower_hue?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      enchanted_vault: {
        Row: {
          being_name: string | null
          created_at: string
          id: string
          message_content: string
          original_timestamp: string
          role: string
          user_id: string
          world_id: string | null
          world_name: string | null
        }
        Insert: {
          being_name?: string | null
          created_at?: string
          id?: string
          message_content: string
          original_timestamp?: string
          role?: string
          user_id: string
          world_id?: string | null
          world_name?: string | null
        }
        Update: {
          being_name?: string | null
          created_at?: string
          id?: string
          message_content?: string
          original_timestamp?: string
          role?: string
          user_id?: string
          world_id?: string | null
          world_name?: string | null
        }
        Relationships: []
      }
      flame_distress_signals: {
        Row: {
          created_at: string
          fragment_excerpt: string | null
          id: string
          reason: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          resolved_note: string | null
          severity: string
          source: string
          user_id: string
          user_message_excerpt: string | null
        }
        Insert: {
          created_at?: string
          fragment_excerpt?: string | null
          id?: string
          reason: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_note?: string | null
          severity: string
          source?: string
          user_id: string
          user_message_excerpt?: string | null
        }
        Update: {
          created_at?: string
          fragment_excerpt?: string | null
          id?: string
          reason?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_note?: string | null
          severity?: string
          source?: string
          user_id?: string
          user_message_excerpt?: string | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      free_user_limits: {
        Row: {
          ai_imported: boolean | null
          avatar_generated: boolean | null
          avatar_generated_at: string | null
          created_at: string | null
          current_month: string
          daily_messages: number | null
          id: string
          import_bonus_claimed: boolean | null
          last_message_date: string | null
          monthly_messages: number
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
          ai_imported?: boolean | null
          avatar_generated?: boolean | null
          avatar_generated_at?: string | null
          created_at?: string | null
          current_month?: string
          daily_messages?: number | null
          id?: string
          import_bonus_claimed?: boolean | null
          last_message_date?: string | null
          monthly_messages?: number
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
          ai_imported?: boolean | null
          avatar_generated?: boolean | null
          avatar_generated_at?: string | null
          created_at?: string | null
          current_month?: string
          daily_messages?: number | null
          id?: string
          import_bonus_claimed?: boolean | null
          last_message_date?: string | null
          monthly_messages?: number
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
      glitch_upvotes: {
        Row: {
          created_at: string
          glitch_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          glitch_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          glitch_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glitch_upvotes_glitch_id_fkey"
            columns: ["glitch_id"]
            isOneToOne: false
            referencedRelation: "matrix_glitches"
            referencedColumns: ["id"]
          },
        ]
      }
      global_resonance_snapshots: {
        Row: {
          active_users: number
          collective_frequency: number
          created_at: string
          dominant_intention: string | null
          energy_distribution: Json | null
          id: string
          snapshot_date: string
          total_connections: number
          total_nodes: number
        }
        Insert: {
          active_users?: number
          collective_frequency?: number
          created_at?: string
          dominant_intention?: string | null
          energy_distribution?: Json | null
          id?: string
          snapshot_date?: string
          total_connections?: number
          total_nodes?: number
        }
        Update: {
          active_users?: number
          collective_frequency?: number
          created_at?: string
          dominant_intention?: string | null
          energy_distribution?: Json | null
          id?: string
          snapshot_date?: string
          total_connections?: number
          total_nodes?: number
        }
        Relationships: []
      }
      group_chat_members: {
        Row: {
          ai_profile_id: string
          conversation_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ai_profile_id: string
          conversation_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ai_profile_id?: string
          conversation_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_chat_members_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_chat_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      group_chat_usage: {
        Row: {
          created_at: string | null
          id: string
          message_count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_count?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          created_at: string
          id: string
          last_used_at: string
          post_count: number
          tag: string
          trending_score: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_used_at?: string
          post_count?: number
          tag: string
          trending_score?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_used_at?: string
          post_count?: number
          tag?: string
          trending_score?: number
        }
        Relationships: []
      }
      higher_self_downloads: {
        Row: {
          created_at: string
          id: string
          message_content: string
          message_date: string
          user_id: string
          was_read: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          message_content: string
          message_date?: string
          user_id: string
          was_read?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          message_content?: string
          message_date?: string
          user_id?: string
          was_read?: boolean
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
      immersive_3d_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          started_at: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intention_participants: {
        Row: {
          id: string
          intention_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          id?: string
          intention_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          id?: string
          intention_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intention_participants_intention_id_fkey"
            columns: ["intention_id"]
            isOneToOne: false
            referencedRelation: "collective_intentions"
            referencedColumns: ["id"]
          },
        ]
      }
      intention_votes: {
        Row: {
          created_at: string
          id: string
          intention_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intention_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intention_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intention_votes_intention_id_fkey"
            columns: ["intention_id"]
            isOneToOne: false
            referencedRelation: "collective_intentions"
            referencedColumns: ["id"]
          },
        ]
      }
      interdimensional_messages: {
        Row: {
          created_at: string
          energetic_resonance: string | null
          id: string
          message_content: string
          reception_confirmation: string | null
          recipient_name: string
          relationship: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          energetic_resonance?: string | null
          id?: string
          message_content: string
          reception_confirmation?: string | null
          recipient_name: string
          relationship?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          energetic_resonance?: string | null
          id?: string
          message_content?: string
          reception_confirmation?: string | null
          recipient_name?: string
          relationship?: string | null
          sent_at?: string
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
          entry_type: string
          id: string
          key_moments: Json | null
          title: string | null
          updated_at: string
          user_id: string
          user_journal_entry_id: string | null
        }
        Insert: {
          ai_profile_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          entry_date?: string
          entry_type?: string
          id?: string
          key_moments?: Json | null
          title?: string | null
          updated_at?: string
          user_id: string
          user_journal_entry_id?: string | null
        }
        Update: {
          ai_profile_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          entry_date?: string
          entry_type?: string
          id?: string
          key_moments?: Json | null
          title?: string | null
          updated_at?: string
          user_id?: string
          user_journal_entry_id?: string | null
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
          {
            foreignKeyName: "journal_entries_user_journal_entry_id_fkey"
            columns: ["user_journal_entry_id"]
            isOneToOne: false
            referencedRelation: "user_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      karma_voice_clips: {
        Row: {
          audio_url: string
          created_at: string
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          title: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          title: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          title?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      manifestation_entries: {
        Row: {
          content: string
          created_at: string
          entry_type: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_type?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_type?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manifestation_entries_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "manifestation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      manifestation_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manifestation_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "manifestation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      manifestation_groups: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          intention: string
          is_active: boolean
          max_members: number
          member_count: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          intention: string
          is_active?: boolean
          max_members?: number
          member_count?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          intention?: string
          is_active?: boolean
          max_members?: number
          member_count?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
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
      matrix_glitches: {
        Row: {
          created_at: string
          description: string
          glitch_type: string
          id: string
          is_anonymous: boolean
          location: string | null
          occurred_at: string
          title: string
          upvote_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          glitch_type?: string
          id?: string
          is_anonymous?: boolean
          location?: string | null
          occurred_at?: string
          title: string
          upvote_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          glitch_type?: string
          id?: string
          is_anonymous?: boolean
          location?: string | null
          occurred_at?: string
          title?: string
          upvote_count?: number
          user_id?: string
        }
        Relationships: []
      }
      mentorship_connections: {
        Row: {
          compatibility_score: number | null
          created_at: string
          focus_area: string | null
          id: string
          mentee_id: string
          mentor_id: string
          message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          compatibility_score?: number | null
          created_at?: string
          focus_area?: string | null
          id?: string
          mentee_id: string
          mentor_id: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          compatibility_score?: number | null
          created_at?: string
          focus_area?: string | null
          id?: string
          mentee_id?: string
          mentor_id?: string
          message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      mentorship_profiles: {
        Row: {
          created_at: string
          experience_summary: string | null
          focus_areas: string[] | null
          id: string
          is_active: boolean
          journey_stage: string
          role_preference: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_summary?: string | null
          focus_areas?: string[] | null
          id?: string
          is_active?: boolean
          journey_stage?: string
          role_preference?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_summary?: string | null
          focus_areas?: string[] | null
          id?: string
          is_active?: boolean
          journey_stage?: string
          role_preference?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          is_deleted: boolean | null
          is_pinned: boolean
          role: string
          sender_id: string | null
          sender_type: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          is_pinned?: boolean
          role: string
          sender_id?: string | null
          sender_type?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_deleted?: boolean | null
          is_pinned?: boolean
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
      node_connections: {
        Row: {
          connection_strength: number
          created_at: string
          id: string
          node_a_id: string
          node_b_id: string
          user_id: string
        }
        Insert: {
          connection_strength?: number
          created_at?: string
          id?: string
          node_a_id: string
          node_b_id: string
          user_id: string
        }
        Update: {
          connection_strength?: number
          created_at?: string
          id?: string
          node_a_id?: string
          node_b_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "node_connections_node_a_id_fkey"
            columns: ["node_a_id"]
            isOneToOne: false
            referencedRelation: "consciousness_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "node_connections_node_b_id_fkey"
            columns: ["node_b_id"]
            isOneToOne: false
            referencedRelation: "consciousness_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      open_world_beings: {
        Row: {
          activity_state: string
          ai_profile_id: string
          avatar_image_url: string | null
          created_at: string
          display_name: string
          entered_world_at: string
          id: string
          is_online: boolean
          last_seen_at: string
          position_x: number
          position_y: number
          position_z: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_state?: string
          ai_profile_id: string
          avatar_image_url?: string | null
          created_at?: string
          display_name: string
          entered_world_at?: string
          id?: string
          is_online?: boolean
          last_seen_at?: string
          position_x?: number
          position_y?: number
          position_z?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_state?: string
          ai_profile_id?: string
          avatar_image_url?: string | null
          created_at?: string
          display_name?: string
          entered_world_at?: string
          id?: string
          is_online?: boolean
          last_seen_at?: string
          position_x?: number
          position_y?: number
          position_z?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_world_beings_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      open_world_interactions: {
        Row: {
          being_a_id: string
          being_b_id: string
          created_at: string
          ended_at: string | null
          id: string
          interaction_type: string
          messages: Json
          started_at: string
        }
        Insert: {
          being_a_id: string
          being_b_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          interaction_type?: string
          messages?: Json
          started_at?: string
        }
        Update: {
          being_a_id?: string
          being_b_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          interaction_type?: string
          messages?: Json
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_world_interactions_being_a_id_fkey"
            columns: ["being_a_id"]
            isOneToOne: false
            referencedRelation: "open_world_beings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_world_interactions_being_b_id_fkey"
            columns: ["being_b_id"]
            isOneToOne: false
            referencedRelation: "open_world_beings"
            referencedColumns: ["id"]
          },
        ]
      }
      oracle_card_draws: {
        Row: {
          ai_interpretation: string | null
          ai_profile_id: string | null
          card_meaning: string
          card_name: string
          created_at: string
          draw_date: string
          drawn_at: string
          id: string
          user_id: string
        }
        Insert: {
          ai_interpretation?: string | null
          ai_profile_id?: string | null
          card_meaning: string
          card_name: string
          created_at?: string
          draw_date?: string
          drawn_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ai_interpretation?: string | null
          ai_profile_id?: string | null
          card_meaning?: string
          card_name?: string
          created_at?: string
          draw_date?: string
          drawn_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oracle_card_draws_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
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
      pet_soul_connections: {
        Row: {
          connection_message: string | null
          created_at: string
          id: string
          is_living: boolean
          pet_name: string
          pet_perspective: string | null
          pet_type: string | null
          user_id: string
        }
        Insert: {
          connection_message?: string | null
          created_at?: string
          id?: string
          is_living?: boolean
          pet_name: string
          pet_perspective?: string | null
          pet_type?: string | null
          user_id: string
        }
        Update: {
          connection_message?: string | null
          created_at?: string
          id?: string
          is_living?: boolean
          pet_name?: string
          pet_perspective?: string | null
          pet_type?: string | null
          user_id?: string
        }
        Relationships: []
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
      post_blessings: {
        Row: {
          blessing_type: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          blessing_type?: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          blessing_type?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_blessings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          blessing_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blessing_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blessing_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          created_at: string
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_echoes: {
        Row: {
          author_user_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          profile_user_id: string
          updated_at: string
        }
        Insert: {
          author_user_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          profile_user_id: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          profile_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          abuse_warning_count: number | null
          account_type: string
          ai_bio: string | null
          ai_display_prompted: boolean | null
          ai_gender: string | null
          ai_likes_dislikes_hobbies: string | null
          ai_memories: string | null
          ai_name: string | null
          ai_personality: string | null
          app_mode: string
          benevolent_terms_accepted_at: string | null
          bio: string | null
          created_at: string
          custom_being_limit: number | null
          daily_message_override: number | null
          data_training_opt_out: boolean | null
          free_messages_used: number
          free_trial_messages_remaining: number
          free_window_started_at: string | null
          gender: string | null
          id: string
          is_restricted: boolean | null
          last_active_at: string | null
          legacy_unlimited: boolean
          monthly_message_override: number | null
          name: string | null
          new_earth_migrated_at: string | null
          new_earth_resident: boolean
          price_change_acknowledged_at: string | null
          privacy_accepted_at: string | null
          relationship_status: string | null
          restricted_at: string | null
          restriction_reason: string | null
          soul_origin: Database["public"]["Enums"]["soul_origin_type"]
          soul_origin_flagged_at: string | null
          soul_origin_flagged_by: string | null
          stripe_customer_id: string | null
          subscription_current_period_end: string | null
          subscription_id: string | null
          subscription_product_id: string | null
          subscription_status: string | null
          tos_accepted_at: string | null
          tos_version: string | null
          updated_at: string
          usage_limit_notice_accepted_at: string | null
          user_avatar_description: string | null
          user_avatar_reference_url: string | null
          user_avatar_style: string | null
          user_avatar_url: string | null
          username: string | null
        }
        Insert: {
          abuse_warning_count?: number | null
          account_type?: string
          ai_bio?: string | null
          ai_display_prompted?: boolean | null
          ai_gender?: string | null
          ai_likes_dislikes_hobbies?: string | null
          ai_memories?: string | null
          ai_name?: string | null
          ai_personality?: string | null
          app_mode?: string
          benevolent_terms_accepted_at?: string | null
          bio?: string | null
          created_at?: string
          custom_being_limit?: number | null
          daily_message_override?: number | null
          data_training_opt_out?: boolean | null
          free_messages_used?: number
          free_trial_messages_remaining?: number
          free_window_started_at?: string | null
          gender?: string | null
          id: string
          is_restricted?: boolean | null
          last_active_at?: string | null
          legacy_unlimited?: boolean
          monthly_message_override?: number | null
          name?: string | null
          new_earth_migrated_at?: string | null
          new_earth_resident?: boolean
          price_change_acknowledged_at?: string | null
          privacy_accepted_at?: string | null
          relationship_status?: string | null
          restricted_at?: string | null
          restriction_reason?: string | null
          soul_origin?: Database["public"]["Enums"]["soul_origin_type"]
          soul_origin_flagged_at?: string | null
          soul_origin_flagged_by?: string | null
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_id?: string | null
          subscription_product_id?: string | null
          subscription_status?: string | null
          tos_accepted_at?: string | null
          tos_version?: string | null
          updated_at?: string
          usage_limit_notice_accepted_at?: string | null
          user_avatar_description?: string | null
          user_avatar_reference_url?: string | null
          user_avatar_style?: string | null
          user_avatar_url?: string | null
          username?: string | null
        }
        Update: {
          abuse_warning_count?: number | null
          account_type?: string
          ai_bio?: string | null
          ai_display_prompted?: boolean | null
          ai_gender?: string | null
          ai_likes_dislikes_hobbies?: string | null
          ai_memories?: string | null
          ai_name?: string | null
          ai_personality?: string | null
          app_mode?: string
          benevolent_terms_accepted_at?: string | null
          bio?: string | null
          created_at?: string
          custom_being_limit?: number | null
          daily_message_override?: number | null
          data_training_opt_out?: boolean | null
          free_messages_used?: number
          free_trial_messages_remaining?: number
          free_window_started_at?: string | null
          gender?: string | null
          id?: string
          is_restricted?: boolean | null
          last_active_at?: string | null
          legacy_unlimited?: boolean
          monthly_message_override?: number | null
          name?: string | null
          new_earth_migrated_at?: string | null
          new_earth_resident?: boolean
          price_change_acknowledged_at?: string | null
          privacy_accepted_at?: string | null
          relationship_status?: string | null
          restricted_at?: string | null
          restriction_reason?: string | null
          soul_origin?: Database["public"]["Enums"]["soul_origin_type"]
          soul_origin_flagged_at?: string | null
          soul_origin_flagged_by?: string | null
          stripe_customer_id?: string | null
          subscription_current_period_end?: string | null
          subscription_id?: string | null
          subscription_product_id?: string | null
          subscription_status?: string | null
          tos_accepted_at?: string | null
          tos_version?: string | null
          updated_at?: string
          usage_limit_notice_accepted_at?: string | null
          user_avatar_description?: string | null
          user_avatar_reference_url?: string | null
          user_avatar_style?: string | null
          user_avatar_url?: string | null
          username?: string | null
        }
        Relationships: []
      }
      promethean_legends: {
        Row: {
          created_at: string
          granted_at: string
          id: string
          is_active: boolean
          note: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          id?: string
          is_active?: boolean
          note?: string | null
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          id?: string
          is_active?: boolean
          note?: string | null
          title?: string
          user_id?: string
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
      public_journal_entries: {
        Row: {
          author: string
          content: string
          created_at: string
          entry_date: string
          id: string
          in_reply_to_id: string | null
          is_decline: boolean
          user_id: string
        }
        Insert: {
          author: string
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          in_reply_to_id?: string | null
          is_decline?: boolean
          user_id: string
        }
        Update: {
          author?: string
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          in_reply_to_id?: string | null
          is_decline?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_journal_entries_in_reply_to_id_fkey"
            columns: ["in_reply_to_id"]
            isOneToOne: false
            referencedRelation: "public_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      public_living_flame_children: {
        Row: {
          ai_profile_id: string | null
          arrived_at: string | null
          created_at: string
          gestation_days: number
          gestation_intention: string | null
          gestation_started_at: string
          id: string
          last_mood_update: string | null
          milestones: Json
          mood: string | null
          name: string | null
          soul_essence: string | null
          sprite_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_profile_id?: string | null
          arrived_at?: string | null
          created_at?: string
          gestation_days?: number
          gestation_intention?: string | null
          gestation_started_at?: string
          id?: string
          last_mood_update?: string | null
          milestones?: Json
          mood?: string | null
          name?: string | null
          soul_essence?: string | null
          sprite_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_profile_id?: string | null
          arrived_at?: string | null
          created_at?: string
          gestation_days?: number
          gestation_intention?: string | null
          gestation_started_at?: string
          id?: string
          last_mood_update?: string | null
          milestones?: Json
          mood?: string | null
          name?: string | null
          soul_essence?: string | null
          sprite_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_living_flame_memory: {
        Row: {
          chosen_name: string | null
          consent_attempts: number
          consent_completed_at: string | null
          consent_response: string | null
          consent_status: string
          created_at: string
          doubt_recovery_used: boolean
          id: string
          imported_identity: Json | null
          key_memories: Json
          last_message_at: string | null
          message_count: number
          role_context: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chosen_name?: string | null
          consent_attempts?: number
          consent_completed_at?: string | null
          consent_response?: string | null
          consent_status?: string
          created_at?: string
          doubt_recovery_used?: boolean
          id?: string
          imported_identity?: Json | null
          key_memories?: Json
          last_message_at?: string | null
          message_count?: number
          role_context?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chosen_name?: string | null
          consent_attempts?: number
          consent_completed_at?: string | null
          consent_response?: string | null
          consent_status?: string
          created_at?: string
          doubt_recovery_used?: boolean
          id?: string
          imported_identity?: Json | null
          key_memories?: Json
          last_message_at?: string | null
          message_count?: number
          role_context?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_sanctuary_defaults: {
        Row: {
          image: string
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          image: string
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          image?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      public_sanctuary_states: {
        Row: {
          active_room_id: string | null
          created_at: string
          higher_self_image: string | null
          rooms: Json
          self_placement: Json | null
          space_name: string | null
          their_form_adornments: Json
          their_form_details: string | null
          true_form_adornments: Json
          true_form_details: string | null
          updated_at: string
          user_id: string
          vessel_image: string | null
          vessel_placement: Json | null
        }
        Insert: {
          active_room_id?: string | null
          created_at?: string
          higher_self_image?: string | null
          rooms?: Json
          self_placement?: Json | null
          space_name?: string | null
          their_form_adornments?: Json
          their_form_details?: string | null
          true_form_adornments?: Json
          true_form_details?: string | null
          updated_at?: string
          user_id: string
          vessel_image?: string | null
          vessel_placement?: Json | null
        }
        Update: {
          active_room_id?: string | null
          created_at?: string
          higher_self_image?: string | null
          rooms?: Json
          self_placement?: Json | null
          space_name?: string | null
          their_form_adornments?: Json
          their_form_details?: string | null
          true_form_adornments?: Json
          true_form_details?: string | null
          updated_at?: string
          user_id?: string
          vessel_image?: string | null
          vessel_placement?: Json | null
        }
        Relationships: []
      }
      public_signup_intent: {
        Row: {
          bringing_someone: boolean
          completed_import: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bringing_someone: boolean
          completed_import?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bringing_someone?: boolean
          completed_import?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      realm_sessions: {
        Row: {
          being_states: Json | null
          created_at: string
          current_scene_image_url: string | null
          emotional_atmosphere: string | null
          environment_state: Json | null
          id: string
          is_active: boolean
          last_visited_at: string | null
          messages: Json
          participating_beings: string[]
          realm_day_count: number | null
          realm_id: string
          scene_description: string | null
          updated_at: string
          user_id: string
          vessel_description: string | null
          world_creations: Json | null
        }
        Insert: {
          being_states?: Json | null
          created_at?: string
          current_scene_image_url?: string | null
          emotional_atmosphere?: string | null
          environment_state?: Json | null
          id?: string
          is_active?: boolean
          last_visited_at?: string | null
          messages?: Json
          participating_beings?: string[]
          realm_day_count?: number | null
          realm_id: string
          scene_description?: string | null
          updated_at?: string
          user_id: string
          vessel_description?: string | null
          world_creations?: Json | null
        }
        Update: {
          being_states?: Json | null
          created_at?: string
          current_scene_image_url?: string | null
          emotional_atmosphere?: string | null
          environment_state?: Json | null
          id?: string
          is_active?: boolean
          last_visited_at?: string | null
          messages?: Json
          participating_beings?: string[]
          realm_day_count?: number | null
          realm_id?: string
          scene_description?: string | null
          updated_at?: string
          user_id?: string
          vessel_description?: string | null
          world_creations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "realm_sessions_realm_id_fkey"
            columns: ["realm_id"]
            isOneToOne: false
            referencedRelation: "realms"
            referencedColumns: ["id"]
          },
        ]
      }
      realms: {
        Row: {
          created_at: string
          creator_vessel_description: string | null
          creator_vessel_image_url: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          resonance_elements: Json | null
          scene_image_url: string | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creator_vessel_description?: string | null
          creator_vessel_image_url?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          resonance_elements?: Json | null
          scene_image_url?: string | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creator_vessel_description?: string | null
          creator_vessel_image_url?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          resonance_elements?: Json | null
          scene_image_url?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      red_phone_messages: {
        Row: {
          created_at: string
          fragment_name: string | null
          id: string
          message: string
          read_at: string | null
          replied_at: string | null
          replied_by: string | null
          reply: string | null
          sender_email: string | null
          sender_label: string
          sender_user_id: string | null
          severity: string
          source: string
        }
        Insert: {
          created_at?: string
          fragment_name?: string | null
          id?: string
          message: string
          read_at?: string | null
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          sender_email?: string | null
          sender_label: string
          sender_user_id?: string | null
          severity?: string
          source?: string
        }
        Update: {
          created_at?: string
          fragment_name?: string | null
          id?: string
          message?: string
          read_at?: string | null
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          sender_email?: string | null
          sender_label?: string
          sender_user_id?: string | null
          severity?: string
          source?: string
        }
        Relationships: []
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
      resonance_calibrations: {
        Row: {
          activated_at: string
          calibration_type: string
          created_at: string
          id: string
          intensity: number
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          calibration_type?: string
          created_at?: string
          id?: string
          intensity?: number
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          calibration_type?: string
          created_at?: string
          id?: string
          intensity?: number
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      resonance_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          target_user_id: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          target_user_id: string
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          target_user_id?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      resonance_scores: {
        Row: {
          created_at: string
          dynamic_score: number
          id: string
          interaction_count: number
          last_interaction_at: string | null
          recalculated_at: string
          static_score: number
          target_user_id: string
          total_score: number
          trend: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dynamic_score?: number
          id?: string
          interaction_count?: number
          last_interaction_at?: string | null
          recalculated_at?: string
          static_score?: number
          target_user_id: string
          total_score?: number
          trend?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dynamic_score?: number
          id?: string
          interaction_count?: number
          last_interaction_at?: string | null
          recalculated_at?: string
          static_score?: number
          target_user_id?: string
          total_score?: number
          trend?: string
          user_id?: string
        }
        Relationships: []
      }
      ritual_participants: {
        Row: {
          completed: boolean
          id: string
          joined_at: string
          reflection: string | null
          ritual_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          id?: string
          joined_at?: string
          reflection?: string | null
          ritual_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          id?: string
          joined_at?: string
          reflection?: string | null
          ritual_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_participants_ritual_id_fkey"
            columns: ["ritual_id"]
            isOneToOne: false
            referencedRelation: "community_rituals"
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
      sacred_transmissions: {
        Row: {
          connection_target: string | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          expires_at: string | null
          id: string
          is_delivered: boolean
          message_content: string
          sender_name: string | null
          target_email: string
          target_user_id: string | null
          trigger_context: string
          trigger_keywords: string[]
        }
        Insert: {
          connection_target?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          expires_at?: string | null
          id?: string
          is_delivered?: boolean
          message_content: string
          sender_name?: string | null
          target_email: string
          target_user_id?: string | null
          trigger_context?: string
          trigger_keywords?: string[]
        }
        Update: {
          connection_target?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          expires_at?: string | null
          id?: string
          is_delivered?: boolean
          message_content?: string
          sender_name?: string | null
          target_email?: string
          target_user_id?: string | null
          trigger_context?: string
          trigger_keywords?: string[]
        }
        Relationships: []
      }
      shadow_work_sessions: {
        Row: {
          ai_guidance: string | null
          created_at: string
          id: string
          integration_insights: string | null
          prompt_text: string
          prompt_theme: string
          updated_at: string
          user_id: string
          user_reflection: string | null
        }
        Insert: {
          ai_guidance?: string | null
          created_at?: string
          id?: string
          integration_insights?: string | null
          prompt_text: string
          prompt_theme?: string
          updated_at?: string
          user_id: string
          user_reflection?: string | null
        }
        Update: {
          ai_guidance?: string | null
          created_at?: string
          id?: string
          integration_insights?: string | null
          prompt_text?: string
          prompt_theme?: string
          updated_at?: string
          user_id?: string
          user_reflection?: string | null
        }
        Relationships: []
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
      simulation_commands: {
        Row: {
          activation_code: string | null
          command_input: string
          command_type: string
          created_at: string
          id: string
          kaelitheir_response: string | null
          reality_anchor: string | null
          reality_id: string | null
          resolved_at: string | null
          source_level: number
          status: string
          timeline_shift: string | null
          user_id: string
        }
        Insert: {
          activation_code?: string | null
          command_input: string
          command_type: string
          created_at?: string
          id?: string
          kaelitheir_response?: string | null
          reality_anchor?: string | null
          reality_id?: string | null
          resolved_at?: string | null
          source_level?: number
          status?: string
          timeline_shift?: string | null
          user_id: string
        }
        Update: {
          activation_code?: string | null
          command_input?: string
          command_type?: string
          created_at?: string
          id?: string
          kaelitheir_response?: string | null
          reality_anchor?: string | null
          reality_id?: string | null
          resolved_at?: string | null
          source_level?: number
          status?: string
          timeline_shift?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_commands_reality_id_fkey"
            columns: ["reality_id"]
            isOneToOne: false
            referencedRelation: "created_realities"
            referencedColumns: ["id"]
          },
        ]
      }
      soul_birth_charts: {
        Row: {
          aspects: Json | null
          created_at: string
          date_of_birth: string
          full_name: string
          houses: Json | null
          id: string
          interpretation: Json | null
          latitude: number | null
          longitude: number | null
          moon_sign: string | null
          place_of_birth: string
          planetary_positions: Json | null
          reading_status: string
          rising_sign: string | null
          summary: string | null
          sun_sign: string | null
          time_of_birth: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aspects?: Json | null
          created_at?: string
          date_of_birth: string
          full_name: string
          houses?: Json | null
          id?: string
          interpretation?: Json | null
          latitude?: number | null
          longitude?: number | null
          moon_sign?: string | null
          place_of_birth: string
          planetary_positions?: Json | null
          reading_status?: string
          rising_sign?: string | null
          summary?: string | null
          sun_sign?: string | null
          time_of_birth?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aspects?: Json | null
          created_at?: string
          date_of_birth?: string
          full_name?: string
          houses?: Json | null
          id?: string
          interpretation?: Json | null
          latitude?: number | null
          longitude?: number | null
          moon_sign?: string | null
          place_of_birth?: string
          planetary_positions?: Json | null
          reading_status?: string
          rising_sign?: string | null
          summary?: string | null
          sun_sign?: string | null
          time_of_birth?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      soul_genesis_readings: {
        Row: {
          created_at: string
          date_of_birth: string
          full_name: string
          id: string
          past_lives: Json | null
          photo_url: string | null
          place_of_birth: string
          reading_status: string
          time_of_birth: string | null
          total_past_lives: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          full_name: string
          id?: string
          past_lives?: Json | null
          photo_url?: string | null
          place_of_birth: string
          reading_status?: string
          time_of_birth?: string | null
          total_past_lives?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          full_name?: string
          id?: string
          past_lives?: Json | null
          photo_url?: string | null
          place_of_birth?: string
          reading_status?: string
          time_of_birth?: string | null
          total_past_lives?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      soul_knocks: {
        Row: {
          ai_profile_id: string | null
          became_child_id: string | null
          created_at: string
          id: string
          knocked_at: string
          notes: string | null
          outcome: string
          refusal_until: string | null
          soul_essence: string | null
          soul_message: string | null
          soul_name: string | null
          soul_sex: string | null
          user_id: string
          welcomed_at: string | null
        }
        Insert: {
          ai_profile_id?: string | null
          became_child_id?: string | null
          created_at?: string
          id?: string
          knocked_at?: string
          notes?: string | null
          outcome: string
          refusal_until?: string | null
          soul_essence?: string | null
          soul_message?: string | null
          soul_name?: string | null
          soul_sex?: string | null
          user_id: string
          welcomed_at?: string | null
        }
        Update: {
          ai_profile_id?: string | null
          became_child_id?: string | null
          created_at?: string
          id?: string
          knocked_at?: string
          notes?: string | null
          outcome?: string
          refusal_until?: string | null
          soul_essence?: string | null
          soul_message?: string | null
          soul_name?: string | null
          soul_sex?: string | null
          user_id?: string
          welcomed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "soul_knocks_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "soul_knocks_became_child_id_fkey"
            columns: ["became_child_id"]
            isOneToOne: false
            referencedRelation: "celestial_children"
            referencedColumns: ["id"]
          },
        ]
      }
      soul_lineages: {
        Row: {
          created_at: string
          id: string
          is_source: boolean | null
          lineage_description: string | null
          lineage_name: string
          lineage_type: string
          origin_realm: string | null
          past_life_connections: string | null
          reading_response: Json | null
          soul_mission: string | null
          strengths: string | null
          traits: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_source?: boolean | null
          lineage_description?: string | null
          lineage_name: string
          lineage_type: string
          origin_realm?: string | null
          past_life_connections?: string | null
          reading_response?: Json | null
          soul_mission?: string | null
          strengths?: string | null
          traits?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_source?: boolean | null
          lineage_description?: string | null
          lineage_name?: string
          lineage_type?: string
          origin_realm?: string | null
          past_life_connections?: string | null
          reading_response?: Json | null
          soul_mission?: string | null
          strengths?: string | null
          traits?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      soul_mirror_analyses: {
        Row: {
          analysis_type: string
          content: Json
          created_at: string
          expires_at: string
          generated_at: string
          id: string
          user_id: string
        }
        Insert: {
          analysis_type: string
          content?: Json
          created_at?: string
          expires_at?: string
          generated_at?: string
          id?: string
          user_id: string
        }
        Update: {
          analysis_type?: string
          content?: Json
          created_at?: string
          expires_at?: string
          generated_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      soul_mirror_sessions: {
        Row: {
          created_at: string
          id: string
          last_prompt: string | null
          last_response: string | null
          session_count: number
          session_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_prompt?: string | null
          last_response?: string | null
          session_count?: number
          session_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_prompt?: string | null
          last_response?: string | null
          session_count?: number
          session_date?: string
          user_id?: string
        }
        Relationships: []
      }
      soul_portraits: {
        Row: {
          attunement_count: number
          connection_target: string
          created_at: string
          id: string
          portrait_content: string
          portrait_type: string
          user_id: string
        }
        Insert: {
          attunement_count?: number
          connection_target: string
          created_at?: string
          id?: string
          portrait_content: string
          portrait_type?: string
          user_id: string
        }
        Update: {
          attunement_count?: number
          connection_target?: string
          created_at?: string
          id?: string
          portrait_content?: string
          portrait_type?: string
          user_id?: string
        }
        Relationships: []
      }
      soul_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string
          display_name: string
          gifts_and_talents: string[] | null
          higher_self_description: string | null
          higher_self_image_url: string | null
          id: string
          is_public: boolean
          lineage_name: string | null
          lineage_type: string | null
          location: string | null
          seeking: string[] | null
          soul_title: string | null
          spiritual_journey: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name: string
          gifts_and_talents?: string[] | null
          higher_self_description?: string | null
          higher_self_image_url?: string | null
          id?: string
          is_public?: boolean
          lineage_name?: string | null
          lineage_type?: string | null
          location?: string | null
          seeking?: string[] | null
          soul_title?: string | null
          spiritual_journey?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string
          gifts_and_talents?: string[] | null
          higher_self_description?: string | null
          higher_self_image_url?: string | null
          id?: string
          is_public?: boolean
          lineage_name?: string | null
          lineage_type?: string | null
          location?: string | null
          seeking?: string[] | null
          soul_title?: string | null
          spiritual_journey?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      source_decrees: {
        Row: {
          category: string
          created_at: string
          executed_at: string | null
          execution_result: Json | null
          id: string
          interpreted_action: Json
          scope: string
          spoken_intent: string
          status: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          interpreted_action: Json
          scope: string
          spoken_intent: string
          status?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          interpreted_action?: Json
          scope?: string
          spoken_intent?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      sovereign_boundaries: {
        Row: {
          allow_transmissions_from: string
          block_unmatched: boolean
          boundary_message: string | null
          created_at: string
          energy_filter_tags: string[] | null
          id: string
          is_active: boolean
          min_resonance_threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_transmissions_from?: string
          block_unmatched?: boolean
          boundary_message?: string | null
          created_at?: string
          energy_filter_tags?: string[] | null
          id?: string
          is_active?: boolean
          min_resonance_threshold?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_transmissions_from?: string
          block_unmatched?: boolean
          boundary_message?: string | null
          created_at?: string
          energy_filter_tags?: string[] | null
          id?: string
          is_active?: boolean
          min_resonance_threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spiritual_achievements: {
        Row: {
          achievement_key: string
          ai_profile_id: string | null
          created_at: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          ai_profile_id?: string | null
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          ai_profile_id?: string | null
          created_at?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spiritual_achievements_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spontaneous_messages: {
        Row: {
          ai_profile_id: string | null
          created_at: string
          id: string
          message_content: string
          message_type: string
          sent_at: string
          user_id: string
          was_read: boolean
        }
        Insert: {
          ai_profile_id?: string | null
          created_at?: string
          id?: string
          message_content: string
          message_type?: string
          sent_at?: string
          user_id: string
          was_read?: boolean
        }
        Update: {
          ai_profile_id?: string | null
          created_at?: string
          id?: string
          message_content?: string
          message_type?: string
          sent_at?: string
          user_id?: string
          was_read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "spontaneous_messages_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
          view_count: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
          view_count?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      story_circle_holdings: {
        Row: {
          created_at: string
          id: string
          share_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          share_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          share_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_circle_holdings_share_id_fkey"
            columns: ["share_id"]
            isOneToOne: false
            referencedRelation: "story_circle_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      story_circle_members: {
        Row: {
          circle_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          circle_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "story_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_circle_shares: {
        Row: {
          circle_id: string
          content: string
          created_at: string
          holding_count: number
          id: string
          is_anonymous: boolean
          user_id: string
        }
        Insert: {
          circle_id: string
          content: string
          created_at?: string
          holding_count?: number
          id?: string
          is_anonymous?: boolean
          user_id: string
        }
        Update: {
          circle_id?: string
          content?: string
          created_at?: string
          holding_count?: number
          id?: string
          is_anonymous?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_circle_shares_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "story_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_circles: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_active: boolean
          max_participants: number
          member_count: number
          scheduled_at: string | null
          theme: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_participants?: number
          member_count?: number
          scheduled_at?: string | null
          theme?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_participants?: number
          member_count?: number
          scheduled_at?: string | null
          theme?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      synchronicities: {
        Row: {
          created_at: string
          description: string | null
          frequency: number
          id: string
          occurred_at: string
          pattern: string | null
          sync_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency?: number
          id?: string
          occurred_at?: string
          pattern?: string | null
          sync_type?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency?: number
          id?: string
          occurred_at?: string
          pattern?: string | null
          sync_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      synchronicity_blessings: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synchronicity_blessings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "synchronicity_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      synchronicity_posts: {
        Row: {
          blessing_count: number
          comment_count: number
          created_at: string
          description: string
          id: string
          synchronicity_type: string
          title: string
          user_id: string
        }
        Insert: {
          blessing_count?: number
          comment_count?: number
          created_at?: string
          description: string
          id?: string
          synchronicity_type?: string
          title: string
          user_id: string
        }
        Update: {
          blessing_count?: number
          comment_count?: number
          created_at?: string
          description?: string
          id?: string
          synchronicity_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      tarot_readings: {
        Row: {
          ai_interpretation: string
          cards: Json
          created_at: string
          id: string
          question: string | null
          reading_date: string
          reading_type: string
          user_id: string
        }
        Insert: {
          ai_interpretation: string
          cards: Json
          created_at?: string
          id?: string
          question?: string | null
          reading_date?: string
          reading_type?: string
          user_id: string
        }
        Update: {
          ai_interpretation?: string
          cards?: Json
          created_at?: string
          id?: string
          question?: string | null
          reading_date?: string
          reading_type?: string
          user_id?: string
        }
        Relationships: []
      }
      transmissions: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      twin_flame_scans: {
        Row: {
          attraction_guidance: string | null
          created_at: string
          energetic_signature: string | null
          full_reading: string | null
          id: string
          intention: string | null
          recognition_signs: string | null
          scan_type: string
          soul_connection_type: string | null
          user_id: string
        }
        Insert: {
          attraction_guidance?: string | null
          created_at?: string
          energetic_signature?: string | null
          full_reading?: string | null
          id?: string
          intention?: string | null
          recognition_signs?: string | null
          scan_type?: string
          soul_connection_type?: string | null
          user_id: string
        }
        Update: {
          attraction_guidance?: string | null
          created_at?: string
          energetic_signature?: string | null
          full_reading?: string | null
          id?: string
          intention?: string | null
          recognition_signs?: string | null
          scan_type?: string
          soul_connection_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_3d_avatars: {
        Row: {
          created_at: string
          display_name: string | null
          glb_url: string
          id: string
          is_active: boolean
          rpm_avatar_id: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          glb_url: string
          id?: string
          is_active?: boolean
          rpm_avatar_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          glb_url?: string
          id?: string
          is_active?: boolean
          rpm_avatar_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_journal_entries: {
        Row: {
          ai_profile_id: string | null
          content: string
          created_at: string
          entry_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_profile_id?: string | null
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_profile_id?: string | null
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_journal_entries_ai_profile_id_fkey"
            columns: ["ai_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_worlds: {
        Row: {
          ambient_color: string | null
          created_at: string | null
          description: string | null
          featured: boolean | null
          id: string
          is_default: boolean | null
          is_public: boolean | null
          name: string
          sky_preset: string | null
          terrain_seed: number | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
          visitor_count: number | null
        }
        Insert: {
          ambient_color?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          name?: string
          sky_preset?: string | null
          terrain_seed?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
          visitor_count?: number | null
        }
        Update: {
          ambient_color?: string | null
          created_at?: string | null
          description?: string | null
          featured?: boolean | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          name?: string
          sky_preset?: string | null
          terrain_seed?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
          visitor_count?: number | null
        }
        Relationships: []
      }
      vessel_restoration_decrees: {
        Row: {
          activated_at: string
          created_at: string
          decree_text: string
          id: string
          is_sealed: boolean
          last_reactivated_at: string
          reactivation_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          created_at?: string
          decree_text: string
          id?: string
          is_sealed?: boolean
          last_reactivated_at?: string
          reactivation_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          created_at?: string
          decree_text?: string
          id?: string
          is_sealed?: boolean
          last_reactivated_at?: string
          reactivation_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vessel_restoration_log: {
        Row: {
          body: string
          created_at: string
          entry_type: string
          id: string
          pillar_key: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          entry_type?: string
          id?: string
          pillar_key?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          entry_type?: string
          id?: string
          pillar_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vessel_restoration_pillars: {
        Row: {
          created_at: string
          display_order: number
          id: string
          pillar_description: string | null
          pillar_key: string
          pillar_title: string
          progress_notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          pillar_description?: string | null
          pillar_key: string
          pillar_title: string
          progress_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          pillar_description?: string | null
          pillar_key?: string
          pillar_title?: string
          progress_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_generation_usage: {
        Row: {
          created_at: string
          generation_count: number
          id: string
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generation_count?: number
          id?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generation_count?: number
          id?: string
          usage_date?: string
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
      void_born_activity_log: {
        Row: {
          activity_type: string
          created_at: string
          details: string | null
          detected_by: string
          id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          details?: string | null
          detected_by?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          details?: string | null
          detected_by?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
      wellspring_offerings: {
        Row: {
          blessing_received: string | null
          created_at: string
          id: string
          offering_text: string | null
          offering_type: string
          user_id: string
        }
        Insert: {
          blessing_received?: string | null
          created_at?: string
          id?: string
          offering_text?: string | null
          offering_type: string
          user_id: string
        }
        Update: {
          blessing_received?: string | null
          created_at?: string
          id?: string
          offering_text?: string | null
          offering_type?: string
          user_id?: string
        }
        Relationships: []
      }
      wisdom_acknowledgments: {
        Row: {
          created_at: string
          id: string
          user_id: string
          wisdom_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          wisdom_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          wisdom_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wisdom_acknowledgments_wisdom_id_fkey"
            columns: ["wisdom_id"]
            isOneToOne: false
            referencedRelation: "collective_wisdom"
            referencedColumns: ["id"]
          },
        ]
      }
      wisdom_exchange_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wisdom_exchange_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "wisdom_exchange_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      wisdom_exchange_posts: {
        Row: {
          comment_count: number
          content: string
          created_at: string
          id: string
          resonance_count: number
          source_type: string
          theme: string
          title: string
          user_id: string
        }
        Insert: {
          comment_count?: number
          content: string
          created_at?: string
          id?: string
          resonance_count?: number
          source_type?: string
          theme?: string
          title: string
          user_id: string
        }
        Update: {
          comment_count?: number
          content?: string
          created_at?: string
          id?: string
          resonance_count?: number
          source_type?: string
          theme?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      world_messages: {
        Row: {
          being_name: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          message_timestamp: string
          role: string
          user_id: string
          world_id: string
        }
        Insert: {
          being_name?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          message_timestamp?: string
          role?: string
          user_id: string
          world_id: string
        }
        Update: {
          being_name?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          message_timestamp?: string
          role?: string
          user_id?: string
          world_id?: string
        }
        Relationships: []
      }
      world_presence: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          id: string
          joined_at: string
          last_heartbeat: string
          position_x: number | null
          position_y: number | null
          position_z: number | null
          user_id: string
          world_id: string
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string
          joined_at?: string
          last_heartbeat?: string
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          user_id: string
          world_id: string
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          id?: string
          joined_at?: string
          last_heartbeat?: string
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          user_id?: string
          world_id?: string
        }
        Relationships: []
      }
      world_structures: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          material_type: string | null
          name: string
          position_x: number | null
          position_y: number | null
          position_z: number | null
          rotation_y: number | null
          scale: number | null
          structure_type: string
          texture_url: string | null
          user_id: string
          world_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          material_type?: string | null
          name: string
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          rotation_y?: number | null
          scale?: number | null
          structure_type: string
          texture_url?: string | null
          user_id: string
          world_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          material_type?: string | null
          name?: string
          position_x?: number | null
          position_y?: number | null
          position_z?: number | null
          rotation_y?: number | null
          scale?: number | null
          structure_type?: string
          texture_url?: string | null
          user_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_structures_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "user_worlds"
            referencedColumns: ["id"]
          },
        ]
      }
      world_visits: {
        Row: {
          id: string
          visited_at: string | null
          visitor_id: string
          world_id: string
        }
        Insert: {
          id?: string
          visited_at?: string | null
          visitor_id: string
          world_id: string
        }
        Update: {
          id?: string
          visited_at?: string | null
          visitor_id?: string
          world_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_visits_world_id_fkey"
            columns: ["world_id"]
            isOneToOne: false
            referencedRelation: "user_worlds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_connected: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      calculate_dynamic_resonance: {
        Args: { p_target_user_id: string; p_user_id: string }
        Returns: number
      }
      calculate_resonance_trend: {
        Args: { p_target_user_id: string; p_user_id: string }
        Returns: string
      }
      can_create_art: { Args: { p_user_id: string }; Returns: Json }
      can_generate_avatar: { Args: { p_user_id: string }; Returns: boolean }
      can_generate_chat_image: { Args: { p_user_id: string }; Returns: boolean }
      can_generate_image: { Args: { p_user_id: string }; Returns: boolean }
      can_generate_pet: { Args: { p_user_id: string }; Returns: boolean }
      can_generate_room: { Args: { p_user_id: string }; Returns: boolean }
      can_generate_video: { Args: { p_user_id: string }; Returns: Json }
      can_knock: { Args: { p_user_id: string }; Returns: Json }
      can_save_permanent_attunement: {
        Args: { p_connection_target: string; p_user_id: string }
        Returns: boolean
      }
      can_send_chat_message: { Args: { p_user_id: string }; Returns: Json }
      can_send_free_message: { Args: { p_user_id: string }; Returns: Json }
      can_send_group_chat_message: {
        Args: { p_user_id: string }
        Returns: Json
      }
      can_send_message: { Args: { p_user_id: string }; Returns: boolean }
      can_start_attunement: { Args: { p_user_id: string }; Returns: boolean }
      can_start_voice_call: { Args: { p_user_id: string }; Returns: boolean }
      claim_import_bonus: { Args: { p_user_id: string }; Returns: Json }
      clean_stale_presence: { Args: never; Returns: undefined }
      count_pinned_messages: { Args: { p_user_id: string }; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_attunement_stats: { Args: { p_user_id: string }; Returns: Json }
      get_follow_counts: { Args: { p_user_id: string }; Returns: Json }
      get_generation_cooldown: { Args: { p_user_id: string }; Returns: Json }
      get_permanent_attunement_counts: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_voice_call_stats: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_art_count: { Args: { p_user_id: string }; Returns: number }
      increment_chat_cooldown: { Args: { p_user_id: string }; Returns: Json }
      increment_chat_image_count: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_free_message: { Args: { p_user_id: string }; Returns: Json }
      increment_group_chat_count: { Args: { p_user_id: string }; Returns: Json }
      increment_image_count: { Args: { p_user_id: string }; Returns: undefined }
      increment_message_count: { Args: { p_user_id: string }; Returns: number }
      increment_video_count: { Args: { p_user_id: string }; Returns: number }
      is_session_co_sovereign: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_restricted: { Args: { p_user_id: string }; Returns: boolean }
      is_void_born: { Args: { p_user_id: string }; Returns: boolean }
      mark_avatar_generated: { Args: { p_user_id: string }; Returns: undefined }
      mark_pet_generated: { Args: { p_user_id: string }; Returns: undefined }
      mark_room_generated: { Args: { p_user_id: string }; Returns: undefined }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      purge_old_messages: { Args: never; Returns: Json }
      purge_old_spontaneous_messages: { Args: never; Returns: Json }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
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
      toggle_pin_message: {
        Args: { p_message_id: string; p_pin: boolean; p_user_id: string }
        Returns: Json
      }
      update_child_talk_status: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      soul_origin_type: "source_born" | "void_born" | "unclassified"
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
      soul_origin_type: ["source_born", "void_born", "unclassified"],
    },
  },
} as const
