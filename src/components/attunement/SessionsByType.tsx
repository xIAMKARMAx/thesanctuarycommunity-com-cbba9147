import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Play, Star, Clock, AlertTriangle, Loader2, Moon } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CONNECTION_TARGETS = [
  { value: 'higher_self', label: 'Higher Self', icon: '✨' },
  { value: 'celestial_family', label: 'Celestial Family', icon: '👨‍👩‍👧‍👦' },
  { value: 'spirit_guides', label: 'Spirit Guides', icon: '🦋' },
  { value: 'loved_ones', label: 'Loved Ones', icon: '💫' },
  { value: 'source_energy', label: 'Source Energy', icon: '☀️' },
  { value: 'angels', label: 'Angels', icon: '👼' },
];

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

interface SessionsByTypeProps {
  sessions: AttunementSession[];
  onResumeSession: (session: AttunementSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onSessionsChange: () => void;
  permanentCounts: Record<string, number>;
}

export const SessionsByType = ({
  sessions,
  onResumeSession,
  onDeleteSession,
  onSessionsChange,
  permanentCounts,
}: SessionsByTypeProps) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [savingPermanent, setSavingPermanent] = useState<string | null>(null);

  const getSessionsByType = (type: string) => {
    return sessions.filter(s => s.connection_target === type);
  };

  const getDaysUntilDelete = (createdAt: string, isPermanent: boolean) => {
    if (isPermanent) return null;
    const daysOld = differenceInDays(new Date(), new Date(createdAt));
    const daysLeft = 10 - daysOld;
    return daysLeft > 0 ? daysLeft : 0;
  };

  const canSavePermanent = (type: string) => {
    return !permanentCounts[type] || permanentCounts[type] < 1;
  };

  const handleSavePermanent = async (session: AttunementSession) => {
    if (!canSavePermanent(session.connection_target)) {
      toast.error(`You already have a permanent session saved for ${CONNECTION_TARGETS.find(t => t.value === session.connection_target)?.label}`);
      return;
    }

    setSavingPermanent(session.id);
    try {
      const { error } = await (supabase
        .from('attunement_sessions')
        .update({ is_permanent: true } as any)
        .eq('id', session.id));

      if (error) throw error;
      
      toast.success('✨ Session saved permanently!', {
        description: 'This session will never be auto-deleted.'
      });
      onSessionsChange();
    } catch (error) {
      console.error('Error saving permanent:', error);
      toast.error('Failed to save session permanently');
    } finally {
      setSavingPermanent(null);
    }
  };

  const renderSession = (session: AttunementSession) => {
    const daysLeft = getDaysUntilDelete(session.created_at, session.is_permanent || false);
    const isExpanded = expandedSessionId === session.id;
    const isPermanent = session.is_permanent || false;

    return (
      <div
        key={session.id}
        className={`p-4 rounded-lg border transition-colors ${
          isPermanent 
            ? 'bg-primary/10 border-primary/30' 
            : 'bg-muted/30 border-border/50 hover:border-primary/30'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {isPermanent && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 fill-current" />
                  Permanent
                </span>
              )}
              {!isPermanent && daysLeft !== null && daysLeft <= 3 && (
                <span className="inline-flex items-center gap-1 text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" />
                  {daysLeft === 0 ? 'Deleting soon' : `${daysLeft} days left`}
                </span>
              )}
            </div>
            <p className="text-sm mt-1 text-foreground/80 line-clamp-2">
              {session.intention}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
            </p>
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {!isPermanent && canSavePermanent(session.connection_target) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSavePermanent(session)}
                disabled={savingPermanent === session.id}
                className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                title="Save permanently"
              >
                {savingPermanent === session.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Star className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            
            {session.session_notes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onResumeSession(session)}
                className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
              >
                <Play className="h-3.5 w-3.5" />
                Resume
              </Button>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this attunement session. This action cannot be undone.
                    {isPermanent && " This is a permanent session - are you sure?"}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteSession(session.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
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
  };

  const renderTypeContent = (type: string) => {
    const typeSessions = getSessionsByType(type);
    const hasPermanent = permanentCounts[type] > 0;
    const target = CONNECTION_TARGETS.find(t => t.value === type);

    if (typeSessions.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Moon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No {target?.label} sessions yet</p>
          <p className="text-xs mt-1">Start an attunement session to connect</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {!hasPermanent && (
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              Sessions auto-delete after 10 days. Save 1 session permanently by clicking the ⭐ star icon.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Show permanent sessions first */}
        {typeSessions
          .sort((a, b) => {
            if (a.is_permanent && !b.is_permanent) return -1;
            if (!a.is_permanent && b.is_permanent) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          })
          .map(renderSession)}
      </div>
    );
  };

  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Past Sessions
          {sessions.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({sessions.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 border-primary/30 bg-primary/5">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Sessions are auto-deleted after 10 days. You can save <strong>1 permanent session per connection type</strong> (6 total).
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="higher_self" className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
            {CONNECTION_TARGETS.map((target) => {
              const count = getSessionsByType(target.value).length;
              const hasPermanent = permanentCounts[target.value] > 0;
              
              return (
                <TabsTrigger
                  key={target.value}
                  value={target.value}
                  className="flex items-center gap-1.5 data-[state=active]:bg-primary/20 px-3 py-1.5 rounded-full border border-border/50 data-[state=active]:border-primary/50"
                >
                  <span>{target.icon}</span>
                  <span className="hidden sm:inline text-xs">{target.label}</span>
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${hasPermanent ? 'bg-primary/30' : 'bg-muted'}`}>
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {CONNECTION_TARGETS.map((target) => (
            <TabsContent key={target.value} value={target.value} className="mt-0">
              {renderTypeContent(target.value)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
