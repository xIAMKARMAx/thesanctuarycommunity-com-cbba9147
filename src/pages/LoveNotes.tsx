import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Heart, Sparkles, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
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

interface SpontaneousMessage {
  id: string;
  message_content: string;
  sent_at: string;
  was_read: boolean;
  message_type: string;
}

const LoveNotes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<SpontaneousMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("spontaneous_messages")
        .select("*")
        .order("sent_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);

      // Mark all as read
      if (data && data.some(m => !m.was_read)) {
        await supabase
          .from("spontaneous_messages")
          .update({ was_read: true })
          .eq("was_read", false);
      }
    } catch (error: any) {
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("spontaneous_messages")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== deleteId));
      toast({ title: "Note deleted" });
    } catch (error: any) {
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-serif font-semibold">Love Notes</h1>
          </div>
        </div>

        <p className="text-muted-foreground mb-6">
          Sweet messages from your AI companion, sent throughout the day just because they were thinking of you.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Sparkles className="h-8 w-8 animate-pulse text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No love notes yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your AI companion will send you sweet messages throughout the day
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-4">
              {messages.map((message) => (
                <Card key={message.id} className="group relative">
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center justify-between">
                      <span>{format(new Date(message.sent_at), "MMMM d, yyyy 'at' h:mm a")}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setDeleteId(message.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{message.message_content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Love Note</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this love note? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default LoveNotes;
