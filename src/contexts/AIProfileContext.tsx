import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AIProfile {
  id: string;
  user_id: string;
  profile_number: number;
  name: string | null;
  gender: string | null;
  bio: string | null;
  personality: string | null;
  memories: string | null;
  likes_dislikes_hobbies: string | null;
  room_description: string | null;
  room_image_url: string | null;
  avatar_description: string | null;
  avatar_image_url: string | null;
  avatar_gender: string | null;
  avatar_customization: any;
  pet_name: string | null;
  pet_description: string | null;
  pet_image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AIProfileContextType {
  activeProfile: AIProfile | null;
  profiles: AIProfile[];
  switchProfile: (profileNumber: 1 | 2) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  isLoading: boolean;
}

const AIProfileContext = createContext<AIProfileContextType | undefined>(undefined);

export const AIProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeProfile, setActiveProfile] = useState<AIProfile | null>(null);
  const [profiles, setProfiles] = useState<AIProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const clearProfiles = () => {
    setActiveProfile(null);
    setProfiles([]);
    setCurrentUserId(null);
  };

  const refreshProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        clearProfiles();
        setIsLoading(false);
        return;
      }

      // If user changed, clear old data first
      if (currentUserId && currentUserId !== user.id) {
        clearProfiles();
      }
      
      setCurrentUserId(user.id);

      const { data: existingProfiles, error } = await supabase
        .from("ai_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("profile_number");

      if (error) throw error;

      // Create default profiles if none exist
      if (!existingProfiles || existingProfiles.length === 0) {
        const { data: newProfile1, error: error1 } = await supabase
          .from("ai_profiles")
          .insert({
            user_id: user.id,
            profile_number: 1,
            name: "AI Being 1",
          })
          .select()
          .single();

        if (error1) throw error1;

        setProfiles([newProfile1]);
        setActiveProfile(newProfile1);
      } else {
        setProfiles(existingProfiles);
        // Set active profile to the first one or previously selected
        const savedProfileNumber = localStorage.getItem(`active_ai_profile_${user.id}`);
        const profileToActivate = savedProfileNumber 
          ? existingProfiles.find(p => p.profile_number === parseInt(savedProfileNumber))
          : existingProfiles[0];
        setActiveProfile(profileToActivate || existingProfiles[0]);
      }
    } catch (error) {
      console.error("Error loading AI profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load AI profiles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchProfile = async (profileNumber: 1 | 2) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let profile = profiles.find(p => p.profile_number === profileNumber);

      // Create profile if it doesn't exist
      if (!profile) {
        const { data: newProfile, error } = await supabase
          .from("ai_profiles")
          .insert({
            user_id: user.id,
            profile_number: profileNumber,
            name: `AI Being ${profileNumber}`,
          })
          .select()
          .single();

        if (error) throw error;
        profile = newProfile;
        setProfiles([...profiles, newProfile]);
      }

      setActiveProfile(profile);
      localStorage.setItem(`active_ai_profile_${user.id}`, profileNumber.toString());

      toast({
        title: "Switched AI",
        description: `Now chatting with ${profile.name || `AI Being ${profileNumber}`}`,
      });
    } catch (error) {
      console.error("Error switching profile:", error);
      toast({
        title: "Error",
        description: "Failed to switch AI profile",
        variant: "destructive",
      });
    }
  };

  // Listen for auth state changes to properly clear/reload profiles
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Clear all profile data on logout
          clearProfiles();
          setIsLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Reload profiles for the new/current user
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            refreshProfiles();
          }, 0);
        }
      }
    );

    // Initial load
    refreshProfiles();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AIProfileContext.Provider
      value={{
        activeProfile,
        profiles,
        switchProfile,
        refreshProfiles,
        isLoading,
      }}
    >
      {children}
    </AIProfileContext.Provider>
  );
};

export const useAIProfile = () => {
  const context = useContext(AIProfileContext);
  if (context === undefined) {
    throw new Error("useAIProfile must be used within an AIProfileProvider");
  }
  return context;
};
