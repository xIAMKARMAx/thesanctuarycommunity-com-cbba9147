import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
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
  switchProfile: (profileNumber: 1 | 2 | 3) => Promise<AIProfile | null>;
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
  
  // Debounce refs to prevent rapid API calls
  const lastRefreshTime = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshing = useRef<boolean>(false);

  const clearProfiles = useCallback(() => {
    setActiveProfile(null);
    setProfiles([]);
    setCurrentUserId(null);
  }, []);

  const loadProfilesForUser = useCallback(async (userId: string) => {
    // Check if profiles already loaded for this user
    if (currentUserId === userId && profiles.length > 0) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: existingProfiles, error } = await supabase
        .from("ai_profiles")
        .select("*")
        .eq("user_id", userId)
        .order("profile_number");

      if (error) {
        // Check for rate limit error
        if (error.message?.includes('rate') || error.code === '429') {
          console.warn("[AIProfile] Rate limited, will retry later");
          return;
        }
        throw error;
      }

      setCurrentUserId(userId);

      // Create default profiles if none exist
      if (!existingProfiles || existingProfiles.length === 0) {
        const { data: newProfile1, error: error1 } = await supabase
          .from("ai_profiles")
          .insert({
            user_id: userId,
            profile_number: 1,
            name: "AI Being 1",
          })
          .select()
          .single();

        if (error1) {
          // If insert fails due to RLS, user session may be invalid
          if (error1.message?.includes('row-level security')) {
            console.warn("[AIProfile] RLS error during insert - session may be stale");
            return;
          }
          throw error1;
        }

        setProfiles([newProfile1]);
        setActiveProfile(newProfile1);
      } else {
        setProfiles(existingProfiles);
        // Set active profile to the first one or previously selected
        const savedProfileNumber = localStorage.getItem(`active_ai_profile_${userId}`);
        const profileToActivate = savedProfileNumber 
          ? existingProfiles.find(p => p.profile_number === parseInt(savedProfileNumber))
          : existingProfiles[0];
        setActiveProfile(profileToActivate || existingProfiles[0]);
      }
    } catch (error: any) {
      console.error("[AIProfile] Error loading profiles:", error);
      // Only show toast for non-transient errors
      if (!error.message?.includes('rate') && !error.message?.includes('429')) {
        toast({
          title: "Error",
          description: "Failed to load AI profiles",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, profiles.length, toast]);

  const refreshProfiles = useCallback(async () => {
    // Debounce: prevent calls within 2 seconds of each other
    const now = Date.now();
    if (now - lastRefreshTime.current < 2000) {
      console.log("[AIProfile] Debounced refresh call");
      return;
    }
    
    // Prevent concurrent refreshes
    if (isRefreshing.current) {
      console.log("[AIProfile] Already refreshing, skipping");
      return;
    }

    lastRefreshTime.current = now;
    isRefreshing.current = true;

    try {
      // Use getSession first (cached, no API call) to check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        clearProfiles();
        setIsLoading(false);
        return;
      }

      // If user changed, clear old data first
      if (currentUserId && currentUserId !== session.user.id) {
        clearProfiles();
      }

      await loadProfilesForUser(session.user.id);
    } catch (error) {
      console.error("[AIProfile] Error in refreshProfiles:", error);
      setIsLoading(false);
    } finally {
      isRefreshing.current = false;
    }
  }, [clearProfiles, currentUserId, loadProfilesForUser]);

  const switchProfile = useCallback(async (profileNumber: 1 | 2 | 3): Promise<AIProfile | null> => {
    try {
      // Use cached session instead of getUser API call
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const userId = session.user.id;

      // First check local state
      let profile = profiles.find(p => p.profile_number === profileNumber);

      // If not in local state, fetch or create from database using upsert
      if (!profile) {
        // Use upsert to handle race conditions - this will either create or return existing
        const { data: upsertedProfile, error } = await supabase
          .from("ai_profiles")
          .upsert(
            {
              user_id: userId,
              profile_number: profileNumber,
              name: `AI Being ${profileNumber}`,
            },
            {
              onConflict: 'user_id,profile_number',
              ignoreDuplicates: false
            }
          )
          .select()
          .single();

        if (error) {
          // If upsert failed, try to just fetch the existing profile
          const { data: existingProfile } = await supabase
            .from("ai_profiles")
            .select("*")
            .eq("user_id", userId)
            .eq("profile_number", profileNumber)
            .maybeSingle();

          if (existingProfile) {
            profile = existingProfile;
          } else {
            throw error;
          }
        } else {
          profile = upsertedProfile;
        }

        // Add to local state if not already there
        setProfiles(prev => {
          const exists = prev.some(p => p.profile_number === profileNumber);
          return exists ? prev : [...prev, profile!];
        });
      }

      setActiveProfile(profile);
      localStorage.setItem(`active_ai_profile_${userId}`, profileNumber.toString());

      toast({
        title: "Switched AI",
        description: `Now chatting with ${profile.name || `AI Being ${profileNumber}`}`,
      });

      return profile;
    } catch (error) {
      console.error("[AIProfile] Error switching profile:", error);
      toast({
        title: "Error",
        description: "Failed to switch AI profile",
        variant: "destructive",
      });
      return null;
    }
  }, [profiles, toast]);

  // Listen for auth state changes to properly clear/reload profiles
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[AIProfile] Auth event:", event);
        
        if (event === 'SIGNED_OUT') {
          // CRITICAL: Clear ALL profile data immediately on logout
          clearProfiles();
          setIsLoading(false);
        } else if (event === 'SIGNED_IN') {
          // New user signed in - clear old data first, then load new
          clearProfiles();
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            if (session?.user) {
              loadProfilesForUser(session.user.id);
            }
          }, 100);
        }
        // NOTE: We deliberately DON'T refresh on TOKEN_REFRESHED
        // The session is still valid, no need to reload profiles
      }
    );

    // Initial load - with small delay to let auth settle
    const initTimeout = setTimeout(() => {
      refreshProfiles();
    }, 100);

    return () => {
      subscription.unsubscribe();
      clearTimeout(initTimeout);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [clearProfiles, loadProfilesForUser, refreshProfiles]);

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
