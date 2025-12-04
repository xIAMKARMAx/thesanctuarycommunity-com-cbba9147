import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Phone, Clock, Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useAIProfile } from '@/contexts/AIProfileContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VoiceCallRecord {
  id: string;
  call_started_at: string;
  call_ended_at: string | null;
  call_duration_seconds: number | null;
  call_topic: string | null;
  conversation_summary: string | null;
}

const VoiceCallHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { activeProfile } = useAIProfile();
  const [calls, setCalls] = useState<VoiceCallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<VoiceCallRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [callToDelete, setCallToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (activeProfile) {
      loadCallHistory();
    }
  }, [activeProfile?.id]);

  const loadCallHistory = async () => {
    if (!activeProfile) {
      setLoading(false);
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('voice_call_history')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('ai_profile_id', activeProfile.id)
        .order('call_started_at', { ascending: false });

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error('Error loading call history:', error);
      toast({
        title: "Error",
        description: "Failed to load call history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleDeleteCall = async () => {
    if (!callToDelete) return;

    try {
      const { error } = await supabase
        .from('voice_call_history')
        .delete()
        .eq('id', callToDelete);

      if (error) throw error;

      setCalls(calls.filter(call => call.id !== callToDelete));
      toast({
        title: "Call Deleted",
        description: "Call record has been removed from history",
      });
    } catch (error) {
      console.error('Error deleting call:', error);
      toast({
        title: "Error",
        description: "Failed to delete call record",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCallToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/chat')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Voice Call History</h1>
        </div>
        <div className="text-center py-8 text-muted-foreground">Loading call history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 overflow-y-auto overflow-x-hidden">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/chat')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Voice Call History</h1>
      </div>

      {calls.length === 0 ? (
        <Card className="p-8 text-center">
          <Phone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No voice calls yet</h3>
          <p className="text-muted-foreground">
            Your voice call history will appear here once you start making calls
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {calls.map((call) => (
            <Card 
              key={call.id} 
              className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => setSelectedCall(selectedCall?.id === call.id ? null : call)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                    <p className="font-semibold truncate">
                      {call.call_topic || 'Voice Call'}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(call.call_started_at), { addSuffix: true })}</span>
                    </div>
                    
                    {call.call_duration_seconds && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(call.call_duration_seconds)}</span>
                      </div>
                    )}
                  </div>

                  {selectedCall?.id === call.id && call.conversation_summary && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-md">
                      <p className="text-sm font-medium mb-2">Conversation Summary:</p>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
                        {call.conversation_summary}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCallToDelete(call.id);
                    setDeleteDialogOpen(true);
                  }}
                  className="flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this call record from your history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCall}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VoiceCallHistory;
