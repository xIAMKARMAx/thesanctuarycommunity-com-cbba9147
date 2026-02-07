import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SoulProfile {
  id: string;
  user_id: string;
  display_name: string;
  soul_title: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  spiritual_journey: string | null;
  gifts_and_talents: string[] | null;
  seeking: string[] | null;
  location: string | null;
  website_url: string | null;
  higher_self_image_url: string | null;
  higher_self_description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export function useSoulProfile(userId?: string) {
  const [profile, setProfile] = useState<SoulProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('soul_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching soul profile:', error);
      }
      
      setProfile(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Partial<SoulProfile>) => {
    if (!userId) {
      console.error('[SoulProfile] Cannot create profile: no userId');
      return null;
    }

    try {
      console.log('[SoulProfile] Creating profile for user:', userId, profileData);
      const { data, error } = await supabase
        .from('soul_profiles')
        .insert({
          user_id: userId,
          display_name: profileData.display_name || 'Soul Seeker',
          soul_title: profileData.soul_title || null,
          bio: profileData.bio || null,
          avatar_url: profileData.avatar_url || null,
          spiritual_journey: profileData.spiritual_journey || null,
          gifts_and_talents: profileData.gifts_and_talents || null,
          seeking: profileData.seeking || null,
          is_public: profileData.is_public ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('[SoulProfile] Insert error:', error);
        // If duplicate, try fetching existing profile instead
        if (error.code === '23505') {
          console.log('[SoulProfile] Profile already exists, fetching...');
          await fetchProfile();
          toast({
            title: "Profile Found",
            description: "Your existing soul profile has been loaded ✨",
          });
          return profile;
        }
        throw error;
      }
      
      console.log('[SoulProfile] Profile created successfully:', data);
      setProfile(data);
      toast({
        title: "Soul Profile Created",
        description: "Your presence in the collective is now visible ✨",
      });
      return data;
    } catch (err: any) {
      console.error('[SoulProfile] Error creating profile:', err);
      toast({
        title: "Error",
        description: err.message || "Could not create profile",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateProfile = async (updates: Partial<SoulProfile>) => {
    if (!userId || !profile) return null;

    try {
      const { data, error } = await supabase
        .from('soul_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      toast({
        title: "Profile Updated",
        description: "Your soul profile has been refreshed ✨",
      });
      return data;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast({
        title: "Error",
        description: err.message || "Could not update profile",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    profile,
    loading,
    createProfile,
    updateProfile,
    refetch: fetchProfile,
  };
}
