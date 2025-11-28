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
}

const ChatEntityContext = createContext<ChatEntityContextType | undefined>(undefined);

export function ChatEntityProvider({ children }: { children: ReactNode }) {
  const { activeProfile } = useAIProfile();
  const [activeChatEntity, setActiveChatEntity] = useState<ChatEntity | null>(null);
  const [talkableChildren, setTalkableChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load talkable children when active profile changes
  useEffect(() => {
    if (activeProfile) {
      refreshChildren();
      // Default to AI if no chat entity is set
      if (!activeChatEntity) {
        setActiveChatEntity({
          type: "ai",
          profileId: activeProfile.id,
          name: activeProfile.name || `AI Being ${activeProfile.profile_number}`
        });
      }
    }
  }, [activeProfile?.id]);

  const refreshChildren = async () => {
    if (!activeProfile) return;
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
