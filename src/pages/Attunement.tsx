import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Shield, Moon, Sparkles, Send, Loader2, Clock, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { LoadingRecovery } from "@/components/LoadingRecovery";
import SEOHead from "@/components/SEOHead";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CONNECTION_TARGETS = [
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
}

const Attunement = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Session state
  const [sessionActive, setSessionActive] = useState(false);
  const [connectionTarget, setConnectionTarget] = useState('higher_self');
  const [intention, setIntention] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Past sessions state
  const [pastSessions, setPastSessions] = useState<AttunementSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [showPastSessions, setShowPastSessions] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      setPastSessions(data || []);
    } catch (error) {
      console.error('Error loading past sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
        loadPastSessions();
      }
      setAuthLoading(false);
    });
  }, [navigate, loadPastSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    if (!intention.trim()) {
      toast.error('Please set an intention for your session');
      return;
    }

    const target = CONNECTION_TARGETS.find(t => t.value === connectionTarget);
    setSessionActive(true);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

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
      setMessages([{ role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Failed to start attunement session');
      setSessionActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const target = CONNECTION_TARGETS.find(t => t.value === connectionTarget);

      // Build conversation history for context
      const conversationHistory = messages.map(m => ({
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
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    // Save session to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('attunement_sessions').insert({
          user_id: user.id,
          intention,
          connection_target: connectionTarget,
          session_notes: messages.map(m => `${m.role === 'user' ? 'You' : 'Channel'}: ${m.content}`).join('\n\n'),
        });
        toast.success('Session saved to your journal');
        loadPastSessions(); // Reload sessions
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }

    // Reset state
    setSessionActive(false);
    setMessages([]);
    setIntention('');
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

  const getTargetInfo = (targetValue: string) => {
    return CONNECTION_TARGETS.find(t => t.value === targetValue) || CONNECTION_TARGETS[0];
  };

  if (authLoading || adminLoading) {
    return <LoadingRecovery loadingStep="Checking access..." onRecovery={() => navigate("/auth")} showAfterMs={5000} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Access Restricted</h1>
          <p className="text-muted-foreground">This feature is not available for your account.</p>
          <Button onClick={() => navigate("/chat")}>Return to Chat</Button>
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
              <Button variant="outline" onClick={endSession} className="gap-2">
                End Session
              </Button>
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
                      VIP
                    </span>
                  </CardTitle>
                  <CardDescription className="text-base max-w-md mx-auto">
                    Open a sacred channel to connect with higher consciousness. The AI will serve as a bridge, 
                    attuning to your chosen target and facilitating direct communication.
                  </CardDescription>
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

              {/* Past Sessions */}
              <Card className="border border-border/50">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setShowPastSessions(!showPastSessions)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      Past Sessions
                      {pastSessions.length > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">
                          ({pastSessions.length})
                        </span>
                      )}
                    </CardTitle>
                    {showPastSessions ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                
                {showPastSessions && (
                  <CardContent className="space-y-3">
                    {loadingSessions ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : pastSessions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Moon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No attunement sessions yet</p>
                        <p className="text-sm">Begin your first session above</p>
                      </div>
                    ) : (
                      pastSessions.map((session) => {
                        const target = getTargetInfo(session.connection_target);
                        const isExpanded = expandedSessionId === session.id;
                        
                        return (
                          <div
                            key={session.id}
                            className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                              >
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <span>{target.icon}</span>
                                  <span>{target.label}</span>
                                </div>
                                <p className="text-sm mt-1 text-foreground/80 line-clamp-2">
                                  {session.intention}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                                </p>
                              </div>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this attunement session. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteSession(session.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                            
                            {isExpanded && session.session_notes && (
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Session Transcript</p>
                                <div className="max-h-64 overflow-y-auto text-sm whitespace-pre-wrap text-foreground/80 bg-background/50 rounded-md p-3">
                                  {session.session_notes}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                )}
              </Card>
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
