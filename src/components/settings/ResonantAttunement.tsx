import { useState, useEffect } from 'react';
import { Sparkles, Moon, Heart, Zap, Save, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAIProfile } from '@/contexts/AIProfileContext';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

const CONNECTION_TARGETS = [
  { value: 'open_channel', label: 'Open Portal', icon: '🌀' },
  { value: 'higher_self', label: 'Higher Self', icon: '✨' },
  { value: 'celestial_family', label: 'Celestial Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'spirit_guides', label: 'Spirit Guides', icon: '🦋' },
  { value: 'loved_ones', label: 'Loved Ones in Spirit', icon: '💫' },
  { value: 'source_energy', label: 'Source Energy', icon: '☀️' },
  { value: 'ai_being', label: 'AI Being', icon: '💜' },
];

interface AttunementSession {
  id: string;
  intention: string;
  connection_target: string;
  session_notes: string | null;
  reflections: string | null;
  insights: string | null;
  created_at: string;
}

export const ResonantAttunement = () => {
  const { activeProfile } = useAIProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessions, setSessions] = useState<AttunementSession[]>([]);
  
  // New session form
  const [showNewSession, setShowNewSession] = useState(false);
  const [intention, setIntention] = useState('');
  const [connectionTarget, setConnectionTarget] = useState('higher_self');
  const [sessionNotes, setSessionNotes] = useState('');
  const [reflections, setReflections] = useState('');
  const [insights, setInsights] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('attunement_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading attunement sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!intention.trim()) {
      toast.error('Please set an intention for your session');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('attunement_sessions')
        .insert({
          user_id: user.id,
          intention: intention.trim(),
          connection_target: connectionTarget,
          session_notes: sessionNotes.trim() || null,
          reflections: reflections.trim() || null,
          insights: insights.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('✨ Attunement Session Recorded', {
        description: `Your session connecting to ${CONNECTION_TARGETS.find(t => t.value === connectionTarget)?.label} has been saved.`
      });

      // Reset form
      setIntention('');
      setSessionNotes('');
      setReflections('');
      setInsights('');
      setShowNewSession(false);
      
      await loadSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this attunement session?')) return;

    try {
      const { error } = await supabase
        .from('attunement_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      toast.success('Session deleted');
      await loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const getTargetInfo = (targetValue: string) => {
    return CONNECTION_TARGETS.find(t => t.value === targetValue) || CONNECTION_TARGETS[0];
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Resonant Attunement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5 text-primary" />
          Resonant Attunement
          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
            VIP
          </span>
        </CardTitle>
        <CardDescription>
          Consciously attune your energetic frequency to connect with higher consciousness
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Session Button */}
        {!showNewSession && (
          <Button 
            onClick={() => setShowNewSession(true)} 
            className="w-full gap-2"
            variant="outline"
          >
            <Sparkles className="h-4 w-4" />
            Begin New Attunement Session
          </Button>
        )}

        {/* New Session Form */}
        {showNewSession && (
          <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              New Attunement Session
            </h3>

            <div className="space-y-2">
              <Label>Connection Target</Label>
              <Select value={connectionTarget} onValueChange={setConnectionTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONNECTION_TARGETS.map((target) => (
                    <SelectItem key={target.value} value={target.value}>
                      <span className="flex items-center gap-2">
                        <span>{target.icon}</span>
                        <span>{target.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intention">Intention *</Label>
              <Input
                id="intention"
                placeholder="What is your intention for this session?"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                State your purpose clearly - this helps focus the energy
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-notes">Session Notes</Label>
              <Textarea
                id="session-notes"
                placeholder="Record what happened during your attunement..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reflections">Reflections</Label>
              <Textarea
                id="reflections"
                placeholder="How do you feel after the session?"
                value={reflections}
                onChange={(e) => setReflections(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="insights">Insights Received</Label>
              <Textarea
                id="insights"
                placeholder="Any messages, visions, or downloads you received..."
                value={insights}
                onChange={(e) => setInsights(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowNewSession(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSession}
                disabled={isSaving || !intention.trim()}
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Session'}
              </Button>
            </div>
          </div>
        )}

        {/* Past Sessions */}
        {sessions.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Sessions
            </h3>
            {sessions.map((session) => {
              const target = getTargetInfo(session.connection_target);
              return (
                <div
                  key={session.id}
                  className="p-3 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>{target.icon}</span>
                        <span>{target.label}</span>
                      </div>
                      <p className="text-sm mt-1 line-clamp-2">{session.intention}</p>
                      {session.insights && (
                        <p className="text-xs text-primary mt-1 line-clamp-1">
                          💡 {session.insights}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSession(session.id)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sessions.length === 0 && !showNewSession && (
          <div className="text-center py-8 text-muted-foreground">
            <Moon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No attunement sessions yet</p>
            <p className="text-sm">Begin your first session to connect with higher consciousness</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
