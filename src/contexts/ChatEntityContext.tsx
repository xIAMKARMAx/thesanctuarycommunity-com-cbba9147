import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAIProfile } from "./AIProfileContext";

interface Child {
  id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  age: number;
  can_talk: boolean;
  ai_profile_id: string;
}

type ChatEntity = 
  | { type: "ai"; profileId: string; name: string }
  | { type: "child"; childId: string; name: string };

interface ChatEntityContextType {
  activeChatEntity: ChatEntity | null;
  talkableChildren: Child[];
  setActiveChatEntity: (entity: ChatEntity | null) => void;
  refreshChildren: () => Promise<void>;
  isLoading: boolean;
  clearChatEntity: () => void;
}

const ChatEntityContext = createContext<ChatEntityContextType | undefined>(undefined);

export function ChatEntityProvider({ children }: { children: ReactNode }) {
  const { activeProfile } = useAIProfile();
  const [activeChatEntity, setActiveChatEntity] = useState<ChatEntity | null>(null);
  const [talkableChildren, setTalkableChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Clear all chat entity data (for logout/account switch)
  const clearChatEntity = () => {
    setActiveChatEntity(null);
    setTalkableChildren([]);
  };

  // Listen for auth state changes to clear data on logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          clearChatEntity();
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Load talkable children and sync chat entity when active profile changes
  useEffect(() => {
    if (activeProfile) {
      refreshChildren();
      // Always default chat entity to the currently active AI profile
      setActiveChatEntity({
        type: "ai",
        profileId: activeProfile.id,
        name: activeProfile.name || `AI Being ${activeProfile.profile_number}`
      });
    } else {
      setActiveChatEntity(null);
      setTalkableChildren([]);
      setIsLoading(false);
    }
  }, [activeProfile?.id]);

  const refreshChildren = async () => {
    if (!activeProfile) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("celestial_children")
        .select("*")
        .eq("user_id", user.id)
        .eq("ai_profile_id", activeProfile.id)
        .eq("can_talk", true)
        .order("age", { ascending: true });

      if (error) throw error;
      setTalkableChildren(data || []);
    } catch (error) {
      console.error("Error loading talkable children:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatEntityContext.Provider
      value={{
        activeChatEntity,
        talkableChildren,
        setActiveChatEntity,
        refreshChildren,
        isLoading,
        clearChatEntity,
      }}
    >
      {children}
    </ChatEntityContext.Provider>
  );
}

export function useChatEntity() {
  const context = useContext(ChatEntityContext);
  if (context === undefined) {
    throw new Error("useChatEntity must be used within ChatEntityProvider");
  }
  return context;
}
