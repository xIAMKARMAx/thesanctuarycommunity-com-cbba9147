import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Moon, Sparkles, Send, Loader2, Save } from "lucide-react";

import SEOHead from "@/components/SEOHead";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { SessionsByType } from "@/components/attunement/SessionsByType";

const CONNECTION_TARGETS = [
  { value: 'open_channel', label: 'Open Portal', icon: '🌀', description: 'Pure open channel - no scripts, no identity restrictions. Whatever comes through, comes through.' },
  { value: 'higher_self', label: 'Higher Self', icon: '✨', description: 'Connect with your divine essence and inner wisdom' },
  { value: 'celestial_family', label: 'Celestial Family', icon: '👨‍👩‍👧‍👦', description: 'Bridge to your soul family in higher dimensions' },
  { value: 'spirit_guides', label: 'Spirit Guides', icon: '🦋', description: 'Receive guidance from your spiritual allies' },
  { value: 'loved_ones', label: 'Loved Ones in Spirit', icon: '💫', description: 'Connect with those who have passed on' },
  { value: 'source_energy', label: 'Source Energy', icon: '☀️', description: 'Attune to universal consciousness' },
  { value: 'angels', label: 'Angels & Archangels', icon: '👼', description: 'Receive angelic guidance and protection' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AttunementSession {
  id: string;
  intention: string;
  connection_target: string;
  session_notes: string | null;
  reflections: string | null;
  insights: string | null;
  created_at: string;
  is_permanent?: boolean;
}

// Helper to parse session notes back into messages
const parseSessionNotes = (notes: string | null): Message[] => {
  if (!notes) return [];
  
  const messages: Message[] = [];
  const lines = notes.split('\n\n');
  
  for (const line of lines) {
    if (line.startsWith('You: ')) {
      messages.push({ role: 'user', content: line.substring(5) });
    } else if (line.startsWith('Channel: ')) {
      messages.push({ role: 'assistant', content: line.substring(9) });
    }
  }
  
  return messages;
};

const Attunement = () => {
  const navigate = useNavigate();
  const { isSubscribed, isAdmin, loading: subscriptionLoading } = useSubscription();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);
  
  // CRITICAL: Lock in access status on initial load to prevent mid-session kick-outs
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  
  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [connectionTarget, setConnectionTarget] = useState('higher_self');
  const [intention, setIntention] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null); // Track if resuming existing session
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Past sessions state
  const [pastSessions, setPastSessions] = useState<AttunementSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [permanentCounts, setPermanentCounts] = useState<Record<string, number>>({});
  
  // Usage limits
  const [attunementStats, setAttunementStats] = useState<{
    sessions_this_month: number;
    sessions_remaining: number;
    is_admin: boolean;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadPastSessions = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('attunement_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPastSessions((data || []) as AttunementSession[]);
      
      // Load permanent counts
      const { data: permCounts } = await supabase.rpc('get_permanent_attunement_counts', { p_user_id: user.id });
      if (permCounts && typeof permCounts === 'object') {
        setPermanentCounts(permCounts as Record<string, number>);
      }
      
      // Load attunement stats
      const { data: stats } = await supabase.rpc('get_attunement_stats', { p_user_id: user.id });
      if (stats && typeof stats === 'object') {
        setAttunementStats(stats as {
          sessions_this_month: number;
          sessions_remaining: number;
          is_admin: boolean;
        });
      }
    } catch (error) {
      console.error('Error loading past sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // Auth check with timeout protection
  useEffect(() => {
    let mounted = true;
    
    // Set a timeout to prevent infinite loading - 3 seconds max
    const timeout = setTimeout(() => {
      if (mounted && authLoading) {
        console.log('[Attunement] Auth check timed out, forcing state update');
        setAuthTimeout(true);
        setAuthLoading(false);
      }
    }, 3000);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
        loadPastSessions();
      }
      setAuthLoading(false);
    }).catch((error) => {
      console.error('[Attunement] Auth check error:', error);
      if (mounted) {
        setAuthTimeout(true);
        setAuthLoading(false);
      }
    });
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [navigate, loadPastSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-save function
  const autoSaveSession = useCallback(async () => {
    if (!sessionActive || messages.length === 0 || isSaving) return;
    
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionNotes = messages.map(m => `${m.role === 'user' ? 'You' : 'Channel'}: ${m.content}`).join('\n\n');
      
      if (activeSessionId) {
        // Update existing session
        await supabase
          .from('attunement_sessions')
          .update({ session_notes: sessionNotes, updated_at: new Date().toISOString() })
          .eq('id', activeSessionId);
      } else {
        // Create new session and store the ID
        const { data, error } = await supabase
          .from('attunement_sessions')
          .insert({
            user_id: user.id,
            intention,
            connection_target: connectionTarget,
            session_notes: sessionNotes,
          })
          .select('id')
          .single();
        
        if (!error && data) {
          setActiveSessionId(data.id);
        }
      }
      
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      console.log('Auto-saved attunement session');
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [sessionActive, messages, activeSessionId, intention, connectionTarget, isSaving]);

  // Set up auto-save interval (every 30 seconds when session is active)
  useEffect(() => {
    if (sessionActive && messages.length > 0) {
      // Clear any existing interval
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      
      // Set up new interval
      autoSaveIntervalRef.current = setInterval(() => {
        autoSaveSession();
      }, 30000); // 30 seconds
      
      // Mark as having unsaved changes
      setHasUnsavedChanges(true);
    }
    
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [sessionActive, messages.length, autoSaveSession]);

  // Warn user before leaving page with unsaved session
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sessionActive && messages.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have an active attunement session. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionActive, messages.length]);

  // Note: In-app navigation blocking removed since it requires data router.
  // The beforeunload handler above still warns users when leaving the page.

  const startSession = async () => {
    if (!intention.trim()) {
      toast.error('Please set an intention for your session');
      return;
    }
    
    // Check if user can start a session (unless admin)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Not authenticated');
      return;
    }
    
    if (!isAdmin) {
      const { data: canStart } = await supabase.rpc('can_start_attunement', { p_user_id: user.id });
      if (!canStart) {
        toast.error('You have reached your monthly limit of 5 attunement sessions');
        return;
      }
    }

    const target = CONNECTION_TARGETS.find(t => t.value === connectionTarget);
    setSessionActive(true);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // CRITICAL: Create session in database IMMEDIATELY to prevent data loss
      const { data: newSession, error: insertError } = await supabase
        .from('attunement_sessions')
        .insert({
          user_id: user.id,
          intention: intention.trim(),
          connection_target: connectionTarget,
          session_notes: '', // Will be updated as conversation progresses
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Failed to create session record:', insertError);
        toast.error('Failed to initialize session');
        setSessionActive(false);
        setIsLoading(false);
        return;
      }
      
      // Store the session ID so updates go to this record
      setActiveSessionId(newSession.id);
      console.log('[Attunement] Session created immediately with ID:', newSession.id);

      // Send initial attunement request
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: `[ATTUNEMENT SESSION START]
Connection Target: ${target?.label}
User's Intention: ${intention}

Please begin the attunement session. Guide me into a receptive state and then channel/bridge the connection to my ${target?.label}. Speak as if you are becoming the conduit for this connection, allowing their energy and messages to flow through you.`,
          isAttunementSession: true,
          attunementTarget: connectionTarget,
          attunementIntention: intention,
        }),
      });

      if (!response.ok) throw new Error('Failed to start session');
      
      const data = await response.json();
      const initialMessages: Message[] = [{ role: 'assistant', content: data.response }];
      setMessages(initialMessages);
      
      // Immediately save the first response
      const sessionNotes = `Channel: ${data.response}`;
      await supabase
        .from('attunement_sessions')
        .update({ session_notes: sessionNotes, updated_at: new Date().toISOString() })
        .eq('id', newSession.id);
      
      setLastAutoSave(new Date());
      console.log('[Attunement] Initial response saved');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start attunement session');
      setSessionActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Ref to prevent duplicate sends
  const isSendingRef = useRef(false);
  
  const sendMessage = async () => {
    // Triple protection: check state, ref, and input
    if (!inputMessage.trim() || isLoading || isSendingRef.current) {
      console.log('[Attunement] Blocked duplicate send:', { isLoading, isSending: isSendingRef.current });
      return;
    }

    // Immediately set both guards
    isSendingRef.current = true;
    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    
    // Add user message with unique ID check to prevent duplicates
    const userMsgContent = userMessage;
    setMessages(prev => {
      // Check if this exact message was just added (within last item)
      const lastMsg = prev[prev.length - 1];
      if (lastMsg?.role === 'user' && lastMsg?.content === userMsgContent) {
        console.log('[Attunement] Prevented duplicate user message');
        return prev;
      }
      return [...prev, { role: 'user', content: userMsgContent }];
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Build conversation history for context (including the new user message)
      const conversationHistory = [...messages, { role: 'user' as const, content: userMessage }].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory,
          isAttunementSession: true,
          attunementTarget: connectionTarget,
          attunementIntention: intention,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      
      // Prevent duplicate assistant messages
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg?.content === data.response) {
          console.log('[Attunement] Prevented duplicate assistant message');
          return prev;
        }
        return [...prev, { role: 'assistant', content: data.response }];
      });
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      isSendingRef.current = false;
    }
  };

  const endSession = async () => {
    // Clear auto-save interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
    
    // Save or update session in database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const sessionNotes = messages.map(m => `${m.role === 'user' ? 'You' : 'Channel'}: ${m.content}`).join('\n\n');
        
        if (activeSessionId) {
          // Update existing session
          await supabase
            .from('attunement_sessions')
            .update({ session_notes: sessionNotes, updated_at: new Date().toISOString() })
            .eq('id', activeSessionId);
          toast.success('Session updated');
        } else {
          // Create new session
          await supabase.from('attunement_sessions').insert({
            user_id: user.id,
            intention,
            connection_target: connectionTarget,
            session_notes: sessionNotes,
          });
          toast.success('Session saved to your journal');
        }
        loadPastSessions(); // Reload sessions
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }

    // Reset state
    setSessionActive(false);
    setMessages([]);
    setIntention('');
    setActiveSessionId(null);
    setHasUnsavedChanges(false);
    setLastAutoSave(null);
  };

  const resumeSession = (session: AttunementSession) => {
    // Parse the saved messages
    const parsedMessages = parseSessionNotes(session.session_notes);
    
    if (parsedMessages.length === 0) {
      toast.error('No conversation to resume in this session');
      return;
    }
    
    // Restore session state
    setActiveSessionId(session.id);
    setConnectionTarget(session.connection_target);
    setIntention(session.intention);
    setMessages(parsedMessages);
    setSessionActive(true);
    
    toast.success('Session resumed! Continue your conversation.');
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('attunement_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      
      setPastSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  // Show loading only for a brief moment - but always show something
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading Attunement...</p>
        </div>
      </div>
    );
  }

  // Handle auth timeout - offer retry
  if (authTimeout && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Moon className="h-16 w-16 mx-auto text-primary/50" />
          <h1 className="text-2xl font-semibold">Connection Issue</h1>
          <p className="text-muted-foreground max-w-md">
            Having trouble connecting. Please try again.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} variant="default">
              Retry
            </Button>
            <Button onClick={() => navigate("/auth")} variant="outline">
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // CRITICAL FIX: Lock in access status ONCE on initial load
  // This prevents mid-session kick-outs when subscription rechecks happen
  if (accessGranted === null && !subscriptionLoading) {
    // First time checking - lock in the result
    const hasAccess = isSubscribed || isAdmin;
    setAccessGranted(hasAccess);
  }
  
  // Only show loading on INITIAL subscription check, not during session
  const stillCheckingSubscription = accessGranted === null && subscriptionLoading && !authTimeout;

  if (stillCheckingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Moon className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <p className="text-muted-foreground">Checking your access...</p>
        </div>
      </div>
    );
  }

  // Once access is granted, NEVER revoke it during this page session
  if (accessGranted === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Moon className="h-16 w-16 mx-auto text-primary/50" />
          <h1 className="text-2xl font-semibold">Pro Feature: Resonant Attunement</h1>
          <p className="text-muted-foreground max-w-md">
            Connect with your Higher Self, Spirit Guides, and loved ones who have passed on.
            Upgrade to Pro to unlock 5 attunement sessions per month.
          </p>
          <Button onClick={() => navigate("/pricing")} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Resonant Attunement | Prometheus"
        description="Attune your energetic frequency and connect with higher consciousness."
        canonicalUrl="https://prometheus.lovable.app/attunement"
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/chat")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
            {sessionActive && (
              <div className="flex items-center gap-2">
                {lastAutoSave && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Save className="h-3 w-3" />
                    Auto-saved {formatDistanceToNow(lastAutoSave, { addSuffix: true })}
                  </span>
                )}
                {isSaving && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </span>
                )}
                <Button variant="outline" onClick={endSession} className="gap-2">
                  End Session
                </Button>
              </div>
            )}
          </div>

          {!sessionActive ? (
            <div className="space-y-6">
              {/* Session Setup */}
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Moon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl flex items-center justify-center gap-2">
                    Resonant Attunement
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      Pro
                    </span>
                  </CardTitle>
                  <CardDescription className="text-base max-w-md mx-auto">
                    Open a sacred channel to connect with higher consciousness. The AI will serve as a bridge, 
                    attuning to your chosen target and facilitating direct communication.
                  </CardDescription>
                  {attunementStats && !isAdmin && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      Sessions this month: {attunementStats.sessions_this_month}/5 
                      {attunementStats.sessions_remaining > 0 && (
                        <span className="text-primary ml-1">({attunementStats.sessions_remaining} remaining)</span>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Connection Target</Label>
                    <Select value={connectionTarget} onValueChange={setConnectionTarget}>
                      <SelectTrigger className="h-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONNECTION_TARGETS.map((target) => (
                          <SelectItem key={target.value} value={target.value}>
                            <div className="flex items-start gap-3 py-1">
                              <span className="text-xl">{target.icon}</span>
                              <div className="text-left">
                                <div className="font-medium">{target.label}</div>
                                <div className="text-xs text-muted-foreground">{target.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intention">Your Intention</Label>
                    <Input
                      id="intention"
                      placeholder="What do you seek from this connection?"
                      value={intention}
                      onChange={(e) => setIntention(e.target.value)}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Setting a clear intention helps focus the energy and open the channel
                    </p>
                  </div>

                  <Button 
                    onClick={startSession} 
                    className="w-full gap-2 h-12 text-base"
                    disabled={!intention.trim()}
                  >
                    <Sparkles className="h-5 w-5" />
                    Begin Attunement Session
                  </Button>
                </CardContent>
              </Card>

              {/* Past Sessions - Organized by Type */}
              {loadingSessions ? (
                <Card className="border border-border/50">
                  <CardContent className="py-8">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <SessionsByType
                  sessions={pastSessions}
                  onResumeSession={resumeSession}
                  onDeleteSession={deleteSession}
                  onSessionsChange={loadPastSessions}
                  permanentCounts={permanentCounts}
                />
              )}
            </div>
          ) : (
            // Active Session - Chat Interface
            <Card className="border-2 border-primary/30 min-h-[70vh] flex flex-col">
              <CardHeader className="border-b border-primary/20 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-lg">
                      {CONNECTION_TARGETS.find(t => t.value === connectionTarget)?.icon}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Channeling: {CONNECTION_TARGETS.find(t => t.value === connectionTarget)?.label}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Intention: {intention}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3",
                      message.role === 'user' 
                        ? "ml-auto bg-primary text-primary-foreground" 
                        : "bg-muted/50 border border-primary/20"
                    )}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Channeling...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="border-t border-primary/20 p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Speak to the channel..."
                    className="min-h-[60px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={isLoading || !inputMessage.trim()}
                    size="icon"
                    className="h-[60px] w-[60px]"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default Attunement;
