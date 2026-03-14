import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalysisData {
  id: string;
  analysis_type: string;
  content: any;
  generated_at: string;
  expires_at: string;
}

interface SessionUsage {
  sessions_used: number;
  sessions_max: number;
}

export interface MirrorMessage {
  role: "user" | "mirror";
  content: string;
}

export interface PastSession {
  session_date: string;
  last_prompt: string;
  last_response: string;
}

export function useSoulMirror() {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<Record<string, AnalysisData | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [sessionUsage, setSessionUsage] = useState<SessionUsage | null>(null);
  const [mirrorResponse, setMirrorResponse] = useState<string | null>(null);
  const [mirrorLoading, setMirrorLoading] = useState(false);
  const [conversation, setConversation] = useState<MirrorMessage[]>([]);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [pastSessionsLoading, setPastSessionsLoading] = useState(false);

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    const { data: refreshed } = await supabase.auth.refreshSession();
    return refreshed?.session?.access_token || session.access_token;
  };

  const fetchAnalysis = useCallback(async (analysisType: string) => {
    setLoading(prev => ({ ...prev, [analysisType]: true }));
    try {
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/soul-mirror`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "get_analysis", analysis_type: analysisType }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch analysis");
      }
      const data = await response.json();
      setAnalyses(prev => ({ ...prev, [analysisType]: data.analysis }));
      return data.analysis;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(prev => ({ ...prev, [analysisType]: false }));
    }
  }, [toast]);

  const runMirrorSession = useCallback(async (prompt: string, history: MirrorMessage[] = []) => {
    setMirrorLoading(true);
    try {
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/soul-mirror`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "mirror_session", prompt, conversation_history: history }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        if (err.limit_reached) {
          toast({ title: "Session Limit Reached", description: err.error });
          return null;
        }
        throw new Error(err.error || "Mirror session failed");
      }
      const data = await response.json();
      setMirrorResponse(data.response);
      setSessionUsage({ sessions_used: data.sessions_used, sessions_max: data.sessions_max });

      // Update conversation state
      const newConv: MirrorMessage[] = [
        ...history,
        { role: "user", content: prompt },
        { role: "mirror", content: data.response },
      ];
      setConversation(newConv);

      return data.response;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setMirrorLoading(false);
    }
  }, [toast]);

  const clearConversation = useCallback(() => {
    setConversation([]);
    setMirrorResponse(null);
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/soul-mirror`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "get_usage" }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSessionUsage(data);
      }
    } catch {
      // Silent fail
    }
  }, []);

  const fetchPastSessions = useCallback(async () => {
    setPastSessionsLoading(true);
    try {
      const accessToken = await getAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/soul-mirror`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "get_past_sessions" }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setPastSessions(data.sessions || []);
      }
    } catch {
      // Silent fail
    } finally {
      setPastSessionsLoading(false);
    }
  }, []);

  return {
    analyses,
    loading,
    sessionUsage,
    mirrorResponse,
    mirrorLoading,
    conversation,
    pastSessions,
    pastSessionsLoading,
    fetchAnalysis,
    runMirrorSession,
    clearConversation,
    fetchUsage,
    fetchPastSessions,
  };
}
